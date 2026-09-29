"""LiveKit Agents worker — the actual voice loop. This is a separate
long-running process (run with `python -m agent.worker dev`, not part of
the FastAPI request cycle) that connects to LiveKit rooms and handles the
STT -> LLM -> TTS pipeline in real time, including barge-in/VAD.

One process instance handles many rooms (LiveKit spins up a job per room);
`entrypoint()` runs once per room/conversation.
"""

import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Annotated

from livekit.agents import (
    Agent,
    AgentSession,
    APIConnectOptions,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.agents.voice.agent_session import SessionConnectOptions
from livekit.plugins import deepgram, elevenlabs, google as lk_google, openai as lk_openai, silero
from pydantic import Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from agent.llm import load_vertex_credentials
from agent.quiz_session import QuizSession
from core.config import Settings, get_settings
from database.models import Conversation, Document, Message, User
from database.session import async_session_factory
from memory.service import retrieve_memory
from prompts.system import build_system_prompt
from tools.change_difficulty import change_difficulty as change_difficulty_tool
from tools.change_language import change_language as change_language_tool
from tools.evaluate_answer import evaluate_answer as evaluate_answer_tool
from tools.generate_quiz import generate_quiz as generate_quiz_tool
from tools.retrieve_memory import retrieve_memory as retrieve_memory_tool
from tools.save_memory import save_memory as save_memory_tool
from tools.search_notes import search_notes as search_notes_tool
from tools.summarize_document import summarize_document as summarize_document_tool
from tools.translate_response import translate_response as translate_response_tool

logger = logging.getLogger("voice-mentor-agent")

# Deepgram's code-switching mode handles Hindi/English mixed speech better
# than pinning a single language when the student might speak either.
STT_LANGUAGE_BY_PREFERENCE = {"en": "en-US", "hi": "multi", "hinglish": "multi"}

# Rough, easily-updated per-1M-token pricing (USD) as of this writing — see
# https://openai.com/api/pricing / https://ai.google.dev/pricing for current
# rates. Dashboard cost figures are estimates, not billing-accurate. Update
# these (or key off settings.openai_model / settings.gemini_model) if you
# switch models.
OPENAI_INPUT_PER_1M = 0.25
OPENAI_OUTPUT_PER_1M = 2.00
GEMINI_INPUT_PER_1M = 0.075
GEMINI_OUTPUT_PER_1M = 0.30


def estimate_openai_cost(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens / 1_000_000) * OPENAI_INPUT_PER_1M + (
        output_tokens / 1_000_000
    ) * OPENAI_OUTPUT_PER_1M


def estimate_gemini_cost(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens / 1_000_000) * GEMINI_INPUT_PER_1M + (
        output_tokens / 1_000_000
    ) * GEMINI_OUTPUT_PER_1M


def estimate_cost(settings: Settings, input_tokens: int, output_tokens: int) -> float:
    if settings.ai_provider == "google":
        return estimate_gemini_cost(input_tokens, output_tokens)
    return estimate_openai_cost(input_tokens, output_tokens)


def build_llm(settings: Settings) -> lk_openai.LLM | lk_google.LLM:
    """Which provider backs the live voice conversation is controlled
    entirely by settings.ai_provider — no other code path needs to change
    to switch. Google mode reuses agent/llm.py's Vertex credential loader
    so both modules share one cached Credentials object."""
    if settings.ai_provider == "google":
        if settings.google_use_vertexai:
            return lk_google.LLM(
                model=settings.gemini_model,
                vertexai=True,
                project=settings.google_cloud_project,
                location=settings.google_cloud_location,
                credentials=load_vertex_credentials(settings.google_application_credentials),
            )
        return lk_google.LLM(model=settings.gemini_model, api_key=settings.gemini_api_key)
    return lk_openai.LLM(model=settings.openai_model, api_key=settings.openai_api_key)


@dataclass
class SessionData:
    db: AsyncSession
    user_id: uuid.UUID
    user_name: str
    conversation_id: uuid.UUID
    language: str
    difficulty_level: str
    response_length: str = "balanced"
    quiz_session: QuizSession = field(default_factory=QuizSession)


class VoiceMentorAgent(Agent):
    def __init__(self, *, instructions: str):
        super().__init__(instructions=instructions)

    @function_tool()
    async def search_notes(
        self,
        context: RunContext[SessionData],
        query: Annotated[str, Field(description="What to search for in the student's uploaded notes")],
    ) -> str:
        """Search the student's uploaded notes/documents for information relevant to the query.
        Use this whenever the student asks something that might be covered in material they uploaded."""
        data = context.userdata
        return await search_notes_tool(data.db, user_id=data.user_id, query=query)

    @function_tool()
    async def generate_quiz(
        self,
        context: RunContext[SessionData],
        topic: Annotated[str, Field(description="The topic to quiz the student on")],
    ) -> str:
        """Start a quiz on the given topic. Generates questions and returns the first one."""
        data = context.userdata
        result = await generate_quiz_tool(
            data.db,
            quiz_session=data.quiz_session,
            user_id=data.user_id,
            topic=topic,
            language=data.language,
            difficulty_level=data.difficulty_level,
        )
        if data.quiz_session.is_active:
            await self.update_instructions(
                build_system_prompt(
                    student_name=data.user_name,
                    language=data.language,
                    difficulty_level=data.difficulty_level,
                    mode="quiz",
                    response_length=data.response_length,
                )
            )
        return result

    @function_tool()
    async def evaluate_answer(
        self,
        context: RunContext[SessionData],
        student_answer: Annotated[str, Field(description="What the student said in answer to the current quiz question")],
    ) -> str:
        """Evaluate the student's answer to the current quiz question and move on to the next one —
        this is the ONLY way to advance a quiz, so call it as soon as the student gives their answer
        or says they're ready to move on (whichever comes first). student_answer must be what the
        student actually said — never invent or summarize an answer on their behalf; if they didn't
        really attempt the question, pass their real words (e.g. "not sure" or "let's skip this one")
        and let this tool handle it, don't fabricate a plausible-sounding answer for them."""
        data = context.userdata
        result = await evaluate_answer_tool(
            data.db,
            quiz_session=data.quiz_session,
            conversation_id=data.conversation_id,
            student_answer=student_answer,
        )
        if not data.quiz_session.is_active:
            # That was the last question — drop back to normal chat instructions.
            await self.update_instructions(
                build_system_prompt(
                    student_name=data.user_name,
                    language=data.language,
                    difficulty_level=data.difficulty_level,
                    mode="chat",
                    response_length=data.response_length,
                )
            )
        return result

    @function_tool()
    async def summarize_document(
        self,
        context: RunContext[SessionData],
        document_name: Annotated[str, Field(description="Filename or approximate name of the uploaded document to summarize")],
    ) -> str:
        """Summarize one of the student's uploaded documents."""
        data = context.userdata
        return await summarize_document_tool(data.db, user_id=data.user_id, document_name=document_name)

    @function_tool()
    async def translate_response(
        self,
        context: RunContext[SessionData],
        text: Annotated[str, Field(description="The text to translate")],
        target_language: Annotated[str, Field(description="Target language: 'en', 'hi', or 'hinglish'")],
    ) -> str:
        """Translate a specific piece of text for the student on request (e.g. 'say that in Hindi').
        This is a one-off translation — use change_language() to switch the whole conversation instead."""
        return await translate_response_tool(text, target_language=target_language)

    @function_tool()
    async def change_language(
        self,
        context: RunContext[SessionData],
        language: Annotated[str, Field(description="'en' for English, 'hi' for Hindi, or 'hinglish'")],
    ) -> str:
        """Switch the language the tutor speaks in for the rest of the conversation."""
        data = context.userdata
        result = await change_language_tool(data.db, user_id=data.user_id, language=language)
        data.language = language
        # The STT plugin's language is set once at session start and doesn't
        # follow the LLM's instructions the way the response language does —
        # without this, speech recognition stays pinned to whatever language
        # the call started in even after the tutor switches to Hindi.
        self.session.stt.update_options(
            language=STT_LANGUAGE_BY_PREFERENCE.get(language, "en-US")
        )
        await self.update_instructions(
            build_system_prompt(
                student_name=data.user_name,
                language=data.language,
                difficulty_level=data.difficulty_level,
                mode="quiz" if data.quiz_session.is_active else "chat",
                response_length=data.response_length,
            )
        )
        return result

    @function_tool()
    async def change_difficulty(
        self,
        context: RunContext[SessionData],
        difficulty_level: Annotated[str, Field(description="'beginner', 'intermediate', or 'advanced'")],
    ) -> str:
        """Adjust how simply or deeply the tutor explains things going forward."""
        data = context.userdata
        result = await change_difficulty_tool(data.db, user_id=data.user_id, difficulty_level=difficulty_level)
        data.difficulty_level = difficulty_level
        await self.update_instructions(
            build_system_prompt(
                student_name=data.user_name,
                language=data.language,
                difficulty_level=data.difficulty_level,
                mode="quiz" if data.quiz_session.is_active else "chat",
                response_length=data.response_length,
            )
        )
        return result

    @function_tool()
    async def save_memory(
        self,
        context: RunContext[SessionData],
        key: Annotated[str, Field(description="Short key for the fact, e.g. 'struggles_with' or 'favorite_subject'")],
        value: Annotated[str, Field(description="The fact to remember")],
    ) -> str:
        """Remember something about the student for future conversations."""
        data = context.userdata
        return await save_memory_tool(data.db, user_id=data.user_id, key=key, value=value)

    @function_tool()
    async def retrieve_memory(
        self,
        context: RunContext[SessionData],
        key: Annotated[str | None, Field(description="Specific fact key to recall, or omit for everything remembered")] = None,
    ) -> str:
        """Recall something previously saved about the student."""
        data = context.userdata
        return await retrieve_memory_tool(data.db, user_id=data.user_id, key=key)


async def entrypoint(ctx: JobContext) -> None:
    settings = get_settings()
    await ctx.connect()
    participant = await ctx.wait_for_participant()

    try:
        metadata = json.loads(participant.metadata or "{}")
    except json.JSONDecodeError:
        metadata = {}

    user_id = uuid.UUID(metadata.get("user_id") or participant.identity)
    user_name = metadata.get("name") or "there"
    language = metadata.get("preferred_language", "en")
    difficulty_level = metadata.get("difficulty_level", "beginner")
    response_length = metadata.get("response_length", "balanced")
    voice_id = metadata.get("voice_id") or settings.elevenlabs_default_voice_id

    db = async_session_factory()

    conversation = Conversation(
        user_id=user_id, title="Voice session", mode="chat", language=language
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    remembered_facts = await retrieve_memory(db, user_id=user_id)
    uploaded_documents = (
        (
            await db.execute(
                select(Document.filename)
                .where(Document.user_id == user_id, Document.status == "ready")
                .order_by(Document.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    system_prompt = build_system_prompt(
        student_name=user_name,
        language=language,
        difficulty_level=difficulty_level,
        mode="chat",
        response_length=response_length,
        remembered_facts=remembered_facts,
        uploaded_documents=uploaded_documents,
    )

    session_data = SessionData(
        db=db,
        user_id=user_id,
        user_name=user_name,
        conversation_id=conversation.id,
        language=language,
        difficulty_level=difficulty_level,
        response_length=response_length,
    )

    session = AgentSession[SessionData](
        userdata=session_data,
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            api_key=settings.deepgram_api_key,
            language=STT_LANGUAGE_BY_PREFERENCE.get(language, "en-US"),
        ),
        llm=build_llm(settings),
        tts=elevenlabs.TTS(api_key=settings.elevenlabs_api_key, voice_id=voice_id),
        # Defaults here lean conservative (LiveKit falls back to waiting
        # longer when end-of-turn confidence is low) — tightened for a
        # voice tutor where snappy turn-taking matters more than tolerating
        # long mid-sentence pauses. 0.3s (previous value) was clipping
        # trailing words after brief pauses (e.g. "take a [pause] quiz"
        # transcribed as just "take a") — 0.5s gives a bit more room
        # without feeling sluggish.
        min_endpointing_delay=0.5,
        max_endpointing_delay=3.0,
        # A bit more retry headroom than the default (3 retries) as cheap
        # insurance against transient API blips — not compensating for a
        # known quota problem the way this was originally added for.
        conn_options=SessionConnectOptions(
            llm_conn_options=APIConnectOptions(max_retry=4, retry_interval=1.5, timeout=10.0)
        ),
    )

    # These two handlers fire from the AgentSession's own event loop and can
    # overlap in time with each other (and with tool calls using the shared
    # `db` above) — each gets its own short-lived session so their commits
    # never race on one AsyncSession, which isn't safe for concurrent use
    # (previously threw "This session is provisioning a new connection;
    # concurrent operations are not permitted" whenever a new message was
    # added while the previous turn's metrics update was still committing).

    @session.on("conversation_item_added")
    def _on_conversation_item_added(event) -> None:
        item = event.item
        role = getattr(item, "role", None)
        text_content = getattr(item, "text_content", None)
        if role not in ("user", "assistant") or not text_content:
            return

        async def _save_message() -> None:
            async with async_session_factory() as message_db:
                message_db.add(
                    Message(conversation_id=conversation.id, role=role, content=text_content)
                )
                await message_db.commit()

        asyncio.create_task(_save_message())

    @session.on("metrics_collected")
    def _on_metrics_collected(event) -> None:
        m = event.metrics
        if m.type != "llm_metrics":
            return

        async def _update_latest_message() -> None:
            async with async_session_factory() as metrics_db:
                stmt = (
                    select(Message)
                    .where(Message.conversation_id == conversation.id, Message.role == "assistant")
                    .order_by(Message.created_at.desc())
                    .limit(1)
                )
                latest = (await metrics_db.execute(stmt)).scalar_one_or_none()
                if latest is None:
                    return
                model_name = (
                    settings.gemini_model if settings.ai_provider == "google" else settings.openai_model
                )
                latest.provider = f"{settings.ai_provider}:{model_name}"
                latest.input_tokens = m.prompt_tokens
                latest.output_tokens = m.completion_tokens
                latest.latency_ms = int(m.duration * 1000)
                latest.estimated_cost_usd = estimate_cost(settings, m.prompt_tokens, m.completion_tokens)
                await metrics_db.commit()

        asyncio.create_task(_update_latest_message())

        asyncio.create_task(_update_latest_message())

    @session.on("error")
    def _on_error(event) -> None:
        # Without this, a failed LLM/STT/TTS call (rate limit, timeout,
        # transient API failure) just goes silent from the student's
        # perspective — no error message, no fallback, nothing. LiveKit
        # already retries transient failures internally; this only fires
        # once it's given up, so a short spoken apology plus a nudge to
        # try again is the right response, not another retry loop.
        error = event.error
        if getattr(error, "recoverable", True):
            return
        logger.warning("Unrecoverable %s error in room %s: %s", type(error).__name__, conversation.id, error)
        session.say(
            "Sorry, I'm having trouble connecting right now — could you try that again in a moment?",
            allow_interruptions=True,
        )

    agent = VoiceMentorAgent(instructions=system_prompt)
    await session.start(agent=agent, room=ctx.room)
    session.generate_reply(
        instructions=(
            f"Greet {user_name} warmly like a real teacher would, in {language}, and ask what "
            "they'd like to study today. Keep it to one or two sentences."
        )
    )

    async def _on_shutdown() -> None:
        conversation.is_active = False
        # ended_at is TIMESTAMP WITHOUT TIME ZONE (matching every other
        # timestamp column in this schema) — a tz-aware value here crashes
        # asyncpg's encoder ("can't subtract offset-naive and offset-aware
        # datetimes"), which was silently swallowing this whole shutdown
        # handler, including the User.preferred_language write below it.
        conversation.ended_at = datetime.now(UTC).replace(tzinfo=None)
        await db.execute(
            update(User).where(User.id == user_id).values(preferred_language=session_data.language)
        )
        await db.commit()
        await db.close()

    ctx.add_shutdown_callback(_on_shutdown)


if __name__ == "__main__":
    _settings = get_settings()
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            ws_url=_settings.livekit_url,
            api_key=_settings.livekit_api_key,
            api_secret=_settings.livekit_api_secret,
        )
    )

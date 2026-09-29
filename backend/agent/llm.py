"""Thin wrapper around the active AI provider (OpenAI or Google Gemini via
Vertex AI) for non-realtime text generation (quiz generation/evaluation,
summarization, translation). RAG embeddings live in rag/embeddings.py, not
here. Which provider is active is controlled entirely by `AI_PROVIDER` in
settings — no code changes needed to switch.

The live voice conversation does NOT go through this module — it uses
LiveKit's own LLM plugin directly inside agent/worker.py (also provider-
dispatched from the same setting), which handles token streaming straight
into TTS for low latency. This module is for one-shot / structured
generation calls made from FastAPI routes and from the LangGraph quiz flow
(agent/quiz_graph.py).
"""

import asyncio
import logging
from functools import lru_cache

import google.auth
import google.auth.credentials
from google import genai
from google.genai import types as genai_types
from openai import AsyncOpenAI

from core.config import Settings, get_settings

logger = logging.getLogger(__name__)

RETRY_ATTEMPTS = 3
RETRY_BASE_DELAY_SECONDS = 1.0

_VERTEX_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


@lru_cache
def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(api_key=settings.openai_api_key)


@lru_cache
def load_vertex_credentials(credentials_path: str) -> google.auth.credentials.Credentials:
    """Loaded explicitly from the service-account JSON path rather than
    relying on ambient `GOOGLE_APPLICATION_CREDENTIALS` discovery, since
    pydantic-settings doesn't export values to real os.environ. Shared with
    agent/worker.py so the live voice LLM and one-shot calls here don't each
    load and cache their own copy of the same credentials."""
    credentials, _ = google.auth.load_credentials_from_file(
        credentials_path, scopes=_VERTEX_SCOPES
    )
    return credentials


@lru_cache
def get_google_client() -> genai.Client:
    """AI Studio mode (google_use_vertexai=false) just needs the plain API
    key instead of loaded credentials."""
    settings = get_settings()
    if settings.google_use_vertexai:
        return genai.Client(
            vertexai=True,
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
            credentials=load_vertex_credentials(settings.google_application_credentials),
        )
    return genai.Client(api_key=settings.gemini_api_key)


async def _with_retries(call, *, attempts: int = RETRY_ATTEMPTS):
    """The realtime conversational LLM gets automatic retries for free from
    LiveKit's AgentSession — these one-shot calls (quiz generation, answer
    grading, summarization, translation) don't, so a single transient
    failure used to crash the whole tool call."""
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return await call()
        except Exception as exc:  # noqa: BLE001 — re-raised after the last attempt
            last_error = exc
            if attempt == attempts:
                break
            delay = RETRY_BASE_DELAY_SECONDS * attempt
            logger.warning(
                "AI provider call failed (attempt %d/%d), retrying in %.1fs: %s",
                attempt,
                attempts,
                delay,
                exc,
            )
            await asyncio.sleep(delay)
    assert last_error is not None
    raise last_error


async def _generate_text_openai(
    settings: Settings, prompt: str, system_instruction: str | None, temperature: float
) -> str:
    client = get_openai_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    async def _call():
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    return await _with_retries(_call)


async def _generate_text_google(
    settings: Settings, prompt: str, system_instruction: str | None, temperature: float
) -> str:
    client = get_google_client()

    async def _call():
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
            ),
        )
        return response.text or ""

    return await _with_retries(_call)


async def generate_text(
    prompt: str,
    *,
    system_instruction: str | None = None,
    temperature: float = 0.7,
) -> str:
    settings = get_settings()
    if settings.ai_provider == "google":
        return await _generate_text_google(settings, prompt, system_instruction, temperature)
    return await _generate_text_openai(settings, prompt, system_instruction, temperature)


async def _generate_structured_openai(
    settings: Settings,
    prompt: str,
    response_schema: type,
    system_instruction: str | None,
    temperature: float,
):
    client = get_openai_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    async def _call():
        response = await client.chat.completions.parse(
            model=settings.openai_model,
            messages=messages,
            temperature=temperature,
            response_format=response_schema,
        )
        return response.choices[0].message.parsed

    return await _with_retries(_call)


async def _generate_structured_google(
    settings: Settings,
    prompt: str,
    response_schema: type,
    system_instruction: str | None,
    temperature: float,
):
    client = get_google_client()

    async def _call():
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        return response.parsed

    return await _with_retries(_call)


async def generate_structured(
    prompt: str,
    *,
    response_schema: type,
    system_instruction: str | None = None,
    temperature: float = 0.4,
):
    """Generate a response constrained to a Pydantic schema (used for quiz
    question generation and answer evaluation, where we need reliable JSON
    back rather than free text)."""
    settings = get_settings()
    if settings.ai_provider == "google":
        return await _generate_structured_google(
            settings, prompt, response_schema, system_instruction, temperature
        )
    return await _generate_structured_openai(
        settings, prompt, response_schema, system_instruction, temperature
    )

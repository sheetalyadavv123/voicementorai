"""LangGraph flow for generating a quiz: optionally ground it in the
student's uploaded notes, then produce structured questions with a single
LLM call. This is the one piece of the agent that's genuinely a
multi-step graph rather than a single conversational turn — the turn-by-turn
"ask, wait for the spoken answer, evaluate" loop during the quiz itself is
driven by the live voice session's tool calls (tools/generate_quiz.py,
tools/evaluate_answer.py), since it has to block on external voice input
between steps, which a single graph.invoke() call can't model.
"""

import uuid
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from agent.llm import generate_structured
from agent.quiz_schemas import QuizQuestion, QuizQuestionSet

DEFAULT_NUM_QUESTIONS = 5


class QuizGraphState(TypedDict):
    topic: str
    language: str
    difficulty_level: str
    user_id: uuid.UUID
    num_questions: int
    context: str
    questions: list[QuizQuestion]


def _build_graph(db: AsyncSession):
    async def retrieve_context(state: QuizGraphState) -> dict:
        from rag.retrieval import search_notes

        chunks = await search_notes(db, user_id=state["user_id"], query=state["topic"], top_k=6)
        context = "\n\n".join(f"[{c.document_filename}] {c.content}" for c in chunks)
        return {"context": context}

    async def generate_questions(state: QuizGraphState) -> dict:
        context_block = (
            f"Ground the questions in these notes when relevant:\n{state['context']}\n\n"
            if state["context"]
            else ""
        )
        prompt = (
            f"Create {state['num_questions']} quiz questions about: {state['topic']}\n"
            f"Difficulty: {state['difficulty_level']}\n"
            f"{context_block}"
            "Each question needs a concise correct_answer and a short explanation "
            "(1-2 sentences) suitable for a spoken response."
        )
        result: QuizQuestionSet = await generate_structured(
            prompt,
            response_schema=QuizQuestionSet,
            system_instruction=(
                "You write quiz questions for a voice-based AI tutor. Questions must be answerable "
                "in a short spoken sentence — no multiple choice lettering, no markdown."
            ),
        )
        return {"questions": result.questions}

    graph = StateGraph(QuizGraphState)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("generate_questions", generate_questions)
    graph.set_entry_point("retrieve_context")
    graph.add_edge("retrieve_context", "generate_questions")
    graph.add_edge("generate_questions", END)
    return graph.compile()


async def generate_quiz_questions(
    db: AsyncSession,
    *,
    topic: str,
    user_id: uuid.UUID,
    language: str = "en",
    difficulty_level: str = "beginner",
    num_questions: int = DEFAULT_NUM_QUESTIONS,
) -> list[QuizQuestion]:
    graph = _build_graph(db)
    result = await graph.ainvoke(
        {
            "topic": topic,
            "language": language,
            "difficulty_level": difficulty_level,
            "user_id": user_id,
            "num_questions": num_questions,
            "context": "",
            "questions": [],
        }
    )
    return result["questions"]

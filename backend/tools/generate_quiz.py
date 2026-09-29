import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from agent.quiz_graph import generate_quiz_questions
from agent.quiz_session import QuizSession


async def generate_quiz(
    db: AsyncSession,
    *,
    quiz_session: QuizSession,
    user_id: uuid.UUID,
    topic: str,
    language: str = "en",
    difficulty_level: str = "beginner",
) -> str:
    """Generate a fresh quiz on `topic` and load it into the given
    QuizSession (mutated in place — the caller's session object lives for
    the whole voice call). Returns the first question as spoken text."""
    questions = await generate_quiz_questions(
        db,
        topic=topic,
        user_id=user_id,
        language=language,
        difficulty_level=difficulty_level,
    )

    if not questions:
        return f"I couldn't come up with quiz questions on {topic} right now — want to try a different topic?"

    quiz_session.reset()
    quiz_session.topic = topic
    quiz_session.questions = questions

    first = quiz_session.current_question
    total = len(quiz_session.questions)
    return f"Great, {total} questions on {topic}. Question 1: {first.question}"

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from agent.llm import generate_structured
from agent.quiz_schemas import AnswerEvaluation
from agent.quiz_session import QuizSession
from database.models import QuizAttempt

logger = logging.getLogger(__name__)

NO_ACTIVE_QUIZ_MESSAGE = "There's no quiz in progress right now — say 'quiz me on <topic>' to start one."


async def evaluate_answer(
    db: AsyncSession,
    *,
    quiz_session: QuizSession,
    conversation_id: uuid.UUID,
    student_answer: str,
) -> str:
    """Evaluate the student's spoken answer to the current quiz question,
    persist the attempt, advance to the next question (or finish the
    quiz), and return what the tutor should say next.

    Always advances on return — even when grading fails — so a transient
    API error can't strand the quiz on the same question forever. Without
    this, a failed grading call used to leave the model with no legitimate
    way to move on, and it would improvise by calling this tool again with
    a fabricated non-answer just to trigger the advance-on-call side
    effect, corrupting quiz_attempts with garbage rows."""
    question = quiz_session.current_question
    if question is None:
        return NO_ACTIVE_QUIZ_MESSAGE

    prompt = (
        f"Question: {question.question}\n"
        f"Expected answer: {question.correct_answer}\n"
        f"Student's spoken answer: {student_answer}\n\n"
        "Judge leniently — spoken answers are informal and don't need exact wording, just the "
        "right idea. Give short, encouraging spoken feedback."
    )

    try:
        evaluation: AnswerEvaluation | None = await generate_structured(
            prompt,
            response_schema=AnswerEvaluation,
            system_instruction="You grade a student's spoken quiz answer for a voice AI tutor.",
        )
    except Exception:
        logger.exception("Failed to grade quiz answer for conversation %s", conversation_id)
        evaluation = None

    if evaluation is None:
        db.add(
            QuizAttempt(
                conversation_id=conversation_id,
                topic=quiz_session.topic,
                question=question.question,
                correct_answer=question.correct_answer,
                user_answer=student_answer,
                is_correct=None,
                explanation="Grading temporarily unavailable.",
            )
        )
        await db.commit()
        quiz_session.advance()
        response = (
            f"Sorry, I couldn't grade that one — for reference, the answer was "
            f"{question.correct_answer}. Let's keep going, that one won't count against you."
        )
    else:
        db.add(
            QuizAttempt(
                conversation_id=conversation_id,
                topic=quiz_session.topic,
                question=question.question,
                correct_answer=question.correct_answer,
                user_answer=student_answer,
                is_correct=evaluation.is_correct,
                explanation=evaluation.feedback,
            )
        )
        await db.commit()

        if evaluation.is_correct:
            quiz_session.score += 1

        quiz_session.advance()
        verdict = "Correct!" if evaluation.is_correct else "Not quite."
        response = f"{verdict} {evaluation.feedback} {question.explanation}"

    next_question = quiz_session.current_question
    if next_question is not None:
        question_number = quiz_session.current_index + 1
        response += f" Question {question_number}: {next_question.question}"
    else:
        total = len(quiz_session.questions)
        response += f" That's the quiz done — you scored {quiz_session.score} out of {total} on {quiz_session.topic}."

    return response

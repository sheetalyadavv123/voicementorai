import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User

VALID_LANGUAGES = {"en", "hi", "hinglish"}


async def change_language(db: AsyncSession, *, user_id: uuid.UUID, language: str) -> str:
    """Persist the student's language preference for future sessions. The
    live session's own instructions are updated separately by the caller
    (agent/worker.py) so the switch takes effect immediately, not just next
    time they log in."""
    if language not in VALID_LANGUAGES:
        return f"I can switch between English, Hindi, and Hinglish — not sure what '{language}' means here."

    await db.execute(update(User).where(User.id == user_id).values(preferred_language=language))
    await db.commit()
    return f"Switched to {language}."

import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User

VALID_LEVELS = {"beginner", "intermediate", "advanced"}


async def change_difficulty(db: AsyncSession, *, user_id: uuid.UUID, difficulty_level: str) -> str:
    if difficulty_level not in VALID_LEVELS:
        return "I can teach at a beginner, intermediate, or advanced level — which one would you like?"

    await db.execute(
        update(User).where(User.id == user_id).values(difficulty_level=difficulty_level)
    )
    await db.commit()
    return f"Got it, I'll explain things at a {difficulty_level} level from now on."

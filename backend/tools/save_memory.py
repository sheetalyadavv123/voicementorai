import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from memory.service import save_memory as save_memory_impl


async def save_memory(db: AsyncSession, *, user_id: uuid.UUID, key: str, value: str) -> str:
    """Remember a fact about the student for future conversations —
    e.g. key='struggles_with', value='fractions', or
    key='last_topic', value='the Mughal Empire'."""
    await save_memory_impl(db, user_id=user_id, key=key, value=value)
    return "Got it, I'll remember that."

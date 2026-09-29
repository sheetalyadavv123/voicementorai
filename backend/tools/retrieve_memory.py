import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from memory.service import retrieve_memory as retrieve_memory_impl


async def retrieve_memory(db: AsyncSession, *, user_id: uuid.UUID, key: str | None = None) -> str:
    """Recall facts previously saved with save_memory(). Pass a specific
    key to look up one fact, or omit it to get everything remembered."""
    facts = await retrieve_memory_impl(db, user_id=user_id, key=key)
    if not facts:
        return "I don't have anything saved about that yet."
    return "\n".join(f"{k}: {v}" for k, v in facts.items())

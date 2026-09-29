import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import UserMemory


async def save_memory(db: AsyncSession, *, user_id: uuid.UUID, key: str, value: str) -> None:
    stmt = (
        insert(UserMemory)
        .values(user_id=user_id, key=key, value=value)
        .on_conflict_do_update(
            index_elements=[UserMemory.user_id, UserMemory.key],
            set_={"value": value},
        )
    )
    await db.execute(stmt)
    await db.commit()


async def retrieve_memory(db: AsyncSession, *, user_id: uuid.UUID, key: str | None = None) -> dict[str, str]:
    stmt = select(UserMemory).where(UserMemory.user_id == user_id)
    if key:
        stmt = stmt.where(UserMemory.key == key)

    result = await db.execute(stmt)
    return {row.key: row.value for row in result.scalars().all()}

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_internal_request
from database.models import Conversation, Message
from database.session import get_db

router = APIRouter(
    prefix="/conversations", tags=["conversations"], dependencies=[Depends(verify_internal_request)]
)


class ConversationOut(BaseModel):
    id: str
    title: str
    mode: str
    language: str
    is_active: bool
    started_at: str
    ended_at: str | None
    message_count: int


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: list[dict] | None
    latency_ms: int | None
    created_at: str


@router.get("", response_model=list[ConversationOut])
async def list_conversations(user_id: str, db: AsyncSession = Depends(get_db)) -> list[ConversationOut]:
    stmt = (
        select(Conversation, func.count(Message.id).label("message_count"))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == uuid.UUID(user_id))
        .group_by(Conversation.id)
        .order_by(Conversation.started_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        ConversationOut(
            id=str(conversation.id),
            title=conversation.title,
            mode=conversation.mode,
            language=conversation.language,
            is_active=conversation.is_active,
            started_at=conversation.started_at.isoformat(),
            ended_at=conversation.ended_at.isoformat() if conversation.ended_at else None,
            message_count=message_count,
        )
        for conversation, message_count in rows
    ]


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def get_conversation_messages(
    conversation_id: str, db: AsyncSession = Depends(get_db)
) -> list[MessageOut]:
    conversation = await db.get(Conversation, uuid.UUID(conversation_id))
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = (await db.execute(stmt)).scalars().all()
    return [
        MessageOut(
            id=str(m.id),
            role=m.role,
            content=m.content,
            citations=m.citations,
            latency_ms=m.latency_ms,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]

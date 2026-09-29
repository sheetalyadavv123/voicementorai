import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from core.security import verify_internal_request
from database.models import Conversation, Document, Message
from database.session import get_db

router = APIRouter(
    prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(verify_internal_request)]
)


class DashboardStats(BaseModel):
    total_conversations: int
    total_messages: int
    total_documents: int
    total_input_tokens: int
    total_output_tokens: int
    estimated_cost_usd: float
    avg_latency_ms: float | None
    ai_provider: str


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str, db: AsyncSession = Depends(get_db)) -> DashboardStats:
    uid = uuid.UUID(user_id)

    conversation_count = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.user_id == uid)
    )
    document_count = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == uid)
    )

    message_stats = (
        await db.execute(
            select(
                func.count(Message.id),
                func.coalesce(func.sum(Message.input_tokens), 0),
                func.coalesce(func.sum(Message.output_tokens), 0),
                func.coalesce(func.sum(Message.estimated_cost_usd), 0.0),
                func.avg(Message.latency_ms),
            )
            .join(Conversation, Conversation.id == Message.conversation_id)
            .where(Conversation.user_id == uid)
        )
    ).one()

    message_count, input_tokens, output_tokens, cost, avg_latency = message_stats

    settings = get_settings()
    model_name = settings.gemini_model if settings.ai_provider == "google" else settings.openai_model

    return DashboardStats(
        total_conversations=conversation_count or 0,
        total_messages=message_count or 0,
        total_documents=document_count or 0,
        total_input_tokens=int(input_tokens or 0),
        total_output_tokens=int(output_tokens or 0),
        estimated_cost_usd=round(float(cost or 0.0), 4),
        avg_latency_ms=round(float(avg_latency), 1) if avg_latency is not None else None,
        ai_provider=f"{settings.ai_provider}:{model_name}",
    )

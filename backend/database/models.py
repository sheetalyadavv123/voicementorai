import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.session import Base

EMBEDDING_DIM = 768


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class User(Base):
    """Mirrors the `auth.users` table owned by Prisma (frontend), which
    lives in its own Postgres schema precisely so Alembic never touches it.
    Declared here only so backend models can build foreign keys and
    relationships against it."""

    __tablename__ = "users"
    __table_args__ = {"schema": "auth", "extend_existing": True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text, unique=True)
    preferred_language: Mapped[str] = mapped_column(Text, default="en")
    difficulty_level: Mapped[str] = mapped_column(Text, default="beginner")

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user")
    documents: Mapped[list["Document"]] = relationship(back_populates="user")
    memories: Mapped[list["UserMemory"]] = relationship(back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(Text, default="New conversation")
    mode: Mapped[str] = mapped_column(Text, default="chat")  # chat | teaching | quiz
    language: Mapped[str] = mapped_column(Text, default="en")  # en | hi | hinglish
    is_active: Mapped[bool] = mapped_column(default=True)
    started_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at"
    )
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(Text)  # user | assistant | system | tool
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)

    # Dashboard metrics — populated per assistant turn.
    provider: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g. "openai:gpt-5.4-mini"
    input_tokens: Mapped[int | None] = mapped_column(nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(nullable=True)
    estimated_cost_usd: Mapped[float | None] = mapped_column(nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(Text)
    storage_path: Mapped[str] = mapped_column(Text)  # gs://... or local uploads/ path
    mime_type: Mapped[str] = mapped_column(Text, default="application/pdf")
    status: Mapped[str] = mapped_column(Text, default="processing")  # processing | ready | failed
    page_count: Mapped[int | None] = mapped_column(nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    chunk_index: Mapped[int] = mapped_column()
    page_number: Mapped[int | None] = mapped_column(nullable=True)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))

    document: Mapped["Document"] = relationship(back_populates="chunks")

    __table_args__ = (
        Index(
            "ix_document_chunks_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )


class UserMemory(Base):
    """Long-term facts distinct from the core profile fields on `users`
    (name / preferred_language / difficulty_level) — e.g. topics studied,
    running summaries, things the student struggles with."""

    __tablename__ = "user_memory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"))
    key: Mapped[str] = mapped_column(Text)
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="memories")

    __table_args__ = (Index("ix_user_memory_user_key", "user_id", "key", unique=True),)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE")
    )
    topic: Mapped[str] = mapped_column(Text)
    question: Mapped[str] = mapped_column(Text)
    correct_answer: Mapped[str] = mapped_column(Text)
    user_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="quiz_attempts")

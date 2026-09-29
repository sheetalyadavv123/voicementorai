import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Document, DocumentChunk
from rag.embeddings import embed_query

DEFAULT_TOP_K = 5


@dataclass
class RetrievedChunk:
    content: str
    document_filename: str
    document_id: str
    page_number: int | None
    similarity: float


async def search_notes(
    db: AsyncSession, *, user_id: uuid.UUID, query: str, top_k: int = DEFAULT_TOP_K
) -> list[RetrievedChunk]:
    """Cosine-similarity search over the user's ready documents. Backs both
    the search_notes() tool and any other RAG lookup."""
    query_embedding = await embed_query(query)
    distance = DocumentChunk.embedding.cosine_distance(query_embedding)

    stmt = (
        select(DocumentChunk, Document.filename, distance.label("distance"))
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.user_id == user_id, Document.status == "ready")
        .order_by(distance)
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        RetrievedChunk(
            content=chunk.content,
            document_filename=filename,
            document_id=str(chunk.document_id),
            page_number=chunk.page_number,
            similarity=1 - dist,
        )
        for chunk, filename, dist in rows
    ]

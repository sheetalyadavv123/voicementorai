import io
import logging
import uuid

from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from core.storage import save_upload
from database.models import Document, DocumentChunk
from rag.chunking import chunk_pages
from rag.embeddings import embed_texts

logger = logging.getLogger(__name__)

EMBEDDING_BATCH_SIZE = 32


async def create_document_record(
    db: AsyncSession, *, user_id: uuid.UUID, filename: str, content: bytes
) -> Document:
    storage_path = await save_upload(content, user_id=str(user_id), filename=filename)
    document = Document(
        user_id=user_id,
        filename=filename,
        storage_path=storage_path,
        status="processing",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def process_document(db: AsyncSession, *, document: Document, content: bytes) -> None:
    """Extract text, chunk it, embed each chunk, and store it — run as a
    background task right after upload so the request returns immediately
    with a `processing` document the frontend can poll."""
    try:
        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        chunks = chunk_pages(pages)

        if not chunks:
            document.status = "failed"
            document.error_message = "No extractable text found in this PDF."
            await db.commit()
            return

        for batch_start in range(0, len(chunks), EMBEDDING_BATCH_SIZE):
            batch = chunks[batch_start : batch_start + EMBEDDING_BATCH_SIZE]
            embeddings = await embed_texts([c.content for c in batch])
            for offset, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                db.add(
                    DocumentChunk(
                        document_id=document.id,
                        chunk_index=batch_start + offset,
                        page_number=chunk.page_number,
                        content=chunk.content,
                        embedding=embedding,
                    )
                )

        document.status = "ready"
        document.page_count = len(pages)
        await db.commit()
    except Exception as exc:  # noqa: BLE001 — surfaced to the user via document.status
        logger.exception("Failed to process document %s", document.id)
        document.status = "failed"
        document.error_message = str(exc)[:500]
        await db.commit()

import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agent.llm import generate_text
from database.models import Document, DocumentChunk

MAX_CONTEXT_CHARS = 24_000  # keeps the summarization prompt within a safe token budget


def _normalize(name: str) -> str:
    """Collapse underscores/hyphens/whitespace and drop the .pdf extension so
    voice-transcribed names ('lakshay resume', 'luxury resume dot pdf') can
    still match the real filename ('lakshay_resume.pdf')."""
    name = re.sub(r"\.pdf$", "", name.strip(), flags=re.IGNORECASE)
    return re.sub(r"[_\-\s]+", " ", name).strip().lower()


async def summarize_document(db: AsyncSession, *, user_id: uuid.UUID, document_name: str) -> str:
    """Summarize an uploaded document by (fuzzy) filename, for spoken
    delivery — a few short paragraphs, not bullet points. The system prompt
    already tells the model the student's real filenames, so a mismatch here
    means voice STT mangled the name badly enough to need a fallback."""
    documents = (
        (
            await db.execute(
                select(Document).where(Document.user_id == user_id, Document.status == "ready")
            )
        )
        .scalars()
        .all()
    )
    if not documents:
        return "You haven't uploaded any documents yet."

    target = _normalize(document_name)
    document = next(
        (doc for doc in documents if target and target in _normalize(doc.filename)), None
    )
    if document is None and len(documents) == 1:
        # No real ambiguity with a single document — use it rather than
        # bouncing the student back and forth over a mangled voice transcript.
        document = documents[0]
    if document is None:
        names = ", ".join(doc.filename for doc in documents)
        return (
            f"I couldn't match '{document_name}' to a document. "
            f"You've uploaded: {names} — which one did you mean?"
        )

    chunks_stmt = (
        select(DocumentChunk.content)
        .where(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index)
    )
    chunk_texts = (await db.execute(chunks_stmt)).scalars().all()

    combined = ""
    for text in chunk_texts:
        if len(combined) + len(text) > MAX_CONTEXT_CHARS:
            break
        combined += text + "\n\n"

    return await generate_text(
        f"Summarize this document for a student, in 3-4 short spoken paragraphs:\n\n{combined}",
        system_instruction="You summarize study material for a voice AI tutor. No markdown, no bullet points — plain spoken prose.",
    )

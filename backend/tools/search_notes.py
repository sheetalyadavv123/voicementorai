import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from rag.retrieval import search_notes as search_notes_impl

NO_RESULTS_MESSAGE = "I couldn't find anything about that in your uploaded notes."


async def search_notes(db: AsyncSession, *, user_id: uuid.UUID, query: str) -> str:
    """Search the student's uploaded notes and return a citation-formatted
    context block the LLM can quote from directly."""
    results = await search_notes_impl(db, user_id=user_id, query=query)
    if not results:
        return NO_RESULTS_MESSAGE

    blocks = []
    for chunk in results:
        page = f", page {chunk.page_number}" if chunk.page_number else ""
        blocks.append(f"Source: {chunk.document_filename}{page}\n{chunk.content}")
    return "\n\n---\n\n".join(blocks)

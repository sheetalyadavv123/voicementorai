from google.genai import types as genai_types

from agent.llm import get_google_client, get_openai_client
from core.config import Settings, get_settings
from database.models import EMBEDDING_DIM


async def _embed_openai(settings: Settings, texts: list[str]) -> list[list[float]]:
    """OpenAI's text-embedding-3 models are symmetric — no separate
    query-vs-document task type needed."""
    client = get_openai_client()
    result = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=texts,
        dimensions=EMBEDDING_DIM,
    )
    return [embedding.embedding for embedding in result.data]


async def _embed_google(
    settings: Settings, texts: list[str], task_type: str
) -> list[list[float]]:
    """Gemini's embedding model is asymmetric — documents and queries need
    different task_type values to land in the same vector space correctly."""
    client = get_google_client()
    result = await client.aio.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=texts,
        config=genai_types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=EMBEDDING_DIM,
        ),
    )
    return [embedding.values for embedding in result.embeddings]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    settings = get_settings()
    if settings.ai_provider == "google":
        return await _embed_google(settings, texts, task_type="RETRIEVAL_DOCUMENT")
    return await _embed_openai(settings, texts)


async def embed_query(text: str) -> list[float]:
    settings = get_settings()
    if settings.ai_provider == "google":
        embeddings = await _embed_google(settings, [text], task_type="RETRIEVAL_QUERY")
    else:
        embeddings = await _embed_openai(settings, [text])
    return embeddings[0]

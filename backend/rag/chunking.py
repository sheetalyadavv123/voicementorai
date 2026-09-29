from dataclasses import dataclass

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


@dataclass
class Chunk:
    content: str
    page_number: int | None


def chunk_pages(pages: list[str], *, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Chunk]:
    """Split extracted PDF page text into overlapping chunks, keeping each
    chunk's originating page number for citations."""
    chunks: list[Chunk] = []

    for page_number, page_text in enumerate(pages, start=1):
        text = " ".join(page_text.split())
        if not text:
            continue

        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(Chunk(content=chunk_text, page_number=page_number))
            if end == len(text):
                break
            start = end - overlap

    return chunks

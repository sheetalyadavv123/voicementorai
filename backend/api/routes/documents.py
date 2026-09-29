import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_internal_request
from database.models import Document
from database.session import get_db
from rag.ingest import create_document_record, process_document

router = APIRouter(
    prefix="/documents", tags=["documents"], dependencies=[Depends(verify_internal_request)]
)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


class DocumentOut(BaseModel):
    id: str
    filename: str
    status: str
    page_count: int | None
    error_message: str | None
    created_at: str

    @classmethod
    def from_model(cls, document: Document) -> "DocumentOut":
        return cls(
            id=str(document.id),
            filename=document.filename,
            status=document.status,
            page_count=document.page_count,
            error_message=document.error_message,
            created_at=document.created_at.isoformat(),
        )


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    user_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported right now.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 25 MB).")
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    document = await create_document_record(
        db, user_id=uuid.UUID(user_id), filename=file.filename or "untitled.pdf", content=content
    )
    background_tasks.add_task(_process_in_background, document.id, content)
    return DocumentOut.from_model(document)


async def _process_in_background(document_id: uuid.UUID, content: bytes) -> None:
    from database.session import async_session_factory

    async with async_session_factory() as db:
        document = await db.get(Document, document_id)
        if document:
            await process_document(db, document=document, content=content)


@router.get("", response_model=list[DocumentOut])
async def list_documents(user_id: str, db: AsyncSession = Depends(get_db)) -> list[DocumentOut]:
    stmt = (
        select(Document)
        .where(Document.user_id == uuid.UUID(user_id))
        .order_by(Document.created_at.desc())
    )
    documents = (await db.execute(stmt)).scalars().all()
    return [DocumentOut.from_model(d) for d in documents]

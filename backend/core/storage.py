"""Upload storage: Google Cloud Storage in production, local disk in dev
when no bucket is configured. Callers only see a `storage_path` string
(gs://... or a local relative path) — they never need to know which
backend is active."""

import uuid
from pathlib import Path

from core.config import get_settings


def _local_dir() -> Path:
    settings = get_settings()
    path = Path(settings.local_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload(content: bytes, *, user_id: str, filename: str) -> str:
    settings = get_settings()
    object_name = f"{user_id}/{uuid.uuid4().hex}-{filename}"

    if settings.gcs_bucket_name:
        from google.cloud import storage

        client = storage.Client(project=settings.gcs_project_id or None)
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(object_name)
        blob.upload_from_string(content, content_type="application/pdf")
        return f"gs://{settings.gcs_bucket_name}/{object_name}"

    local_path = _local_dir() / object_name
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_bytes(content)
    return str(local_path)

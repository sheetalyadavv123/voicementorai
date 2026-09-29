from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]

    # --- Internal service-to-service auth ---
    # Shared secret between the Next.js BFF and this backend. Requests that
    # don't present it are rejected before touching any route logic.
    internal_api_secret: str = "dev-only-change-me"

    # --- Database ---
    database_url: str = (
        "postgresql+asyncpg://voicementor:voicementor@localhost:5432/voicementor"
    )

    # --- AI ---
    # Runtime-togglable provider: "openai" or "google". OpenAI is the
    # default after repeated, unresolved 429 RESOURCE_EXHAUSTED failures on
    # the Google side under real conversational load — see docs/setup.md's
    # history. The Google path is kept working (not deleted) as a fallback,
    # toggled with this one env var, no code changes required.
    ai_provider: str = "openai"

    openai_api_key: str = ""
    openai_model: str = "gpt-5.4-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Google Gemini via Vertex AI (service-account JSON, "secrets.json"
    # approach) — loaded explicitly via google.auth.load_credentials_from_file
    # in agent/llm.py, not via ambient GOOGLE_APPLICATION_CREDENTIALS
    # discovery, since pydantic-settings doesn't export values to real
    # os.environ. Set google_use_vertexai=false to use a plain AI Studio key
    # instead (gemini_api_key), decoupled from any GCP project's Vertex quota.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    google_use_vertexai: bool = True
    google_cloud_project: str = ""
    google_cloud_location: str = "global"
    google_application_credentials: str = ""

    # --- Voice ---
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""
    deepgram_api_key: str = ""
    elevenlabs_api_key: str = ""
    # "Sarah" — one of ElevenLabs' current default voices, confirmed
    # available on free-tier API access. Older well-known IDs (e.g. the
    # "Rachel" voice, 21m00Tcm4TlvDq8ikWAM) have since moved behind
    # ElevenLabs' paid-only voice library and 402 on synthesis.
    elevenlabs_default_voice_id: str = "EXAVITQu4vr4xnSDxMaL"

    # --- Storage ---
    gcs_bucket_name: str = ""
    gcs_project_id: str = ""
    # Falls back to local disk under uploads/ when no bucket is configured,
    # so RAG upload works in local dev without a GCP project.
    local_upload_dir: str = "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()

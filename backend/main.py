from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import conversations, dashboard, documents, health, livekit
from core.config import get_settings

settings = get_settings()

app = FastAPI(title="Voice Mentor AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(livekit.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

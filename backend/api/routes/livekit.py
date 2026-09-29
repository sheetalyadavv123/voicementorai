import json
import uuid

from fastapi import APIRouter, Depends
from livekit import api as livekit_api
from pydantic import BaseModel

from core.config import get_settings
from core.security import verify_internal_request

router = APIRouter(prefix="/livekit", tags=["livekit"], dependencies=[Depends(verify_internal_request)])


class TokenRequest(BaseModel):
    user_id: str
    name: str
    preferred_language: str = "en"
    difficulty_level: str = "beginner"
    voice_id: str | None = None
    response_length: str = "balanced"


class TokenResponse(BaseModel):
    token: str
    url: str
    room_name: str


@router.post("/token", response_model=TokenResponse)
async def create_room_token(payload: TokenRequest) -> TokenResponse:
    settings = get_settings()
    room_name = f"mentor-{payload.user_id}-{uuid.uuid4().hex[:8]}"

    # Participant metadata is how the LiveKit agent worker (a separate,
    # long-running process — see agent/worker.py) learns who it's talking
    # to and in what language/difficulty, without a round trip back to
    # this API on room join.
    metadata = json.dumps(
        {
            "user_id": payload.user_id,
            "name": payload.name,
            "preferred_language": payload.preferred_language,
            "difficulty_level": payload.difficulty_level,
            "voice_id": payload.voice_id,
            "response_length": payload.response_length,
        }
    )

    token = (
        livekit_api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(payload.user_id)
        .with_name(payload.name)
        .with_metadata(metadata)
        .with_grants(
            livekit_api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
    )

    return TokenResponse(token=token.to_jwt(), url=settings.livekit_url, room_name=room_name)

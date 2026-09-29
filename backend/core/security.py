from fastapi import Header, HTTPException, status

from core.config import get_settings


async def verify_internal_request(x_internal_api_key: str = Header(default="")) -> None:
    """Every route in this API is only ever called by the Next.js BFF
    (server-side), never directly by the browser — the browser has no
    Postgres/LiveKit/OpenAI credentials and no session token this backend
    can verify on its own. The BFF authenticates the user via NextAuth and
    forwards a trusted user_id; this header is what proves the request
    actually came from the BFF and not the public internet."""
    settings = get_settings()
    if not x_internal_api_key or x_internal_api_key != settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

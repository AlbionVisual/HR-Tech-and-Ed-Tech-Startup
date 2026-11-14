import hashlib
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService


async def test_session_lifecycle(db):
    repository = AuthRepository(db)
    user, _ = await repository.get_or_create_identity(
        "google",
        "google-session",
        {
            "username": None,
            "display_name": "Session user",
            "avatar_url": None,
            "email": None,
            "raw": {"sub": "google-session"},
        },
    )
    token = "session-token"
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    await repository.create_session(
        user.id,
        token_hash,
        datetime.now(timezone.utc) + timedelta(days=1),
        None,
        None,
    )

    http = httpx.AsyncClient()
    service = AuthService(settings, http, repository)
    try:
        current = await service.current_user(token)
        assert current is not None and current.id == user.id

        await service.logout(token)
        assert await service.current_user(token) is None

        expired_token = "expired-token"
        await repository.create_session(
            user.id,
            hashlib.sha256(expired_token.encode("utf-8")).hexdigest(),
            datetime.now(timezone.utc) - timedelta(minutes=1),
            None,
            None,
        )
        assert await service.current_user(expired_token) is None
    finally:
        await http.aclose()

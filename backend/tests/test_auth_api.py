import hashlib
from datetime import datetime, timedelta, timezone

import httpx
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app
from app.modules.auth.repository import AuthRepository


async def test_protected_endpoints_require_session(db):
    app.dependency_overrides.clear()
    app.state.http = httpx.AsyncClient()
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            for path in (
                "/api/v1/interviews",
                "/api/v1/resumes/checks",
                "/api/v1/tests/stats",
                "/api/v1/profile",
                "/api/v1/auth/me",
            ):
                response = await client.get(path)
                assert response.status_code == 401, path

            response = await client.post(
                "/api/v1/ai/chat/stream",
                json={
                    "task": "interview",
                    "mode": "practice",
                    "messages": [],
                    "provider": "mock",
                    "model": "demo",
                },
            )
            assert response.status_code == 401
    finally:
        await app.state.http.aclose()


async def test_session_cookie_and_logout(db):
    app.dependency_overrides.clear()
    repository = AuthRepository(db)
    user, _ = await repository.get_or_create_identity(
        "google",
        "cookie-user",
        {
            "username": None,
            "display_name": "Cookie user",
            "avatar_url": None,
            "email": None,
            "raw": {"sub": "cookie-user"},
        },
    )
    token = "cookie-token"
    await repository.create_session(
        user.id,
        hashlib.sha256(token.encode("utf-8")).hexdigest(),
        datetime.now(timezone.utc) + timedelta(days=1),
        None,
        None,
    )

    app.state.http = httpx.AsyncClient()
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            cookies={settings.session_cookie_name: token},
        ) as client:
            me = await client.get("/api/v1/auth/me")
            assert me.status_code == 200, me.text
            assert me.json()["display_name"] == "Cookie user"

            profile = await client.get("/api/v1/profile")
            assert profile.status_code == 200, profile.text

            logout = await client.post("/api/v1/auth/logout")
            assert logout.status_code == 204

            after = await client.get("/api/v1/auth/me")
            assert after.status_code == 401
    finally:
        await app.state.http.aclose()


async def test_auth_providers_report_missing_configuration(db):
    app.dependency_overrides.clear()
    app.state.http = httpx.AsyncClient()
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            google = await client.post(
                "/api/v1/auth/google",
                json={"credential": "x" * 20},
            )
            assert google.status_code == 503
            assert google.json()["detail"]["code"] == "not_configured"

            telegram = await client.get("/api/v1/auth/telegram/start")
            assert telegram.status_code == 503
            assert telegram.json()["detail"]["code"] == "not_configured"
    finally:
        await app.state.http.aclose()

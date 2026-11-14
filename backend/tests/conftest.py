import os
from uuid import UUID

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings, settings
from app.core.db.connection import database
from app.core.db.models import Base, User
from app.core.db.schema import ensure_schema
from app.main import app
from app.modules.auth.deps import get_current_user, get_current_user_id
from app.modules.auth.repository import AuthRepository
from app.modules.tests.seed import seed_test_catalog


TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TEST_USER = User(
    id=TEST_USER_ID,
    display_name="Test user",
    avatar_url=None,
    profile={},
)


@pytest.fixture
async def db():
    settings.gemini_api_key = ""
    settings.openrouter_api_key = ""
    settings.aiai_api_key = ""
    settings.ai_default_provider = "mock"
    settings.google_client_id = ""
    settings.telegram_client_id = ""
    settings.telegram_client_secret = ""
    database._settings = Settings(
        database_url=os.getenv(
            "TEST_DATABASE_URL",
            "sqlite+aiosqlite:///:memory:",
        )
    )
    await database.start()
    await ensure_schema(database)
    async with database.session() as session:
        session.add(
            User(
                id=TEST_USER_ID,
                display_name=TEST_USER.display_name,
                avatar_url=None,
                profile={},
            )
        )
    await seed_test_catalog(database)
    try:
        yield database
    finally:
        async with database.engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        await database.stop()


async def _current_test_user() -> User:
    user = await AuthRepository(database).get_user(TEST_USER_ID)
    if user is None:
        raise RuntimeError("Test user is missing")
    return user


@pytest.fixture
async def client(db):
    app.state.http = httpx.AsyncClient()
    app.dependency_overrides[get_current_user] = _current_test_user
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        await app.state.http.aclose()

import os

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.db.connection import database
from app.core.db.models import Base
from app.core.db.schema import ensure_schema
from app.main import app
from app.modules.tests.seed import seed_test_catalog


@pytest.fixture
async def db():
    database._settings = Settings(
        database_url=os.getenv(
            "TEST_DATABASE_URL",
            "sqlite+aiosqlite:///:memory:",
        )
    )
    await database.start()
    await ensure_schema(database)
    await seed_test_catalog(database)
    try:
        yield database
    finally:
        async with database.engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        await database.stop()


@pytest.fixture
async def client(db):
    app.state.http = httpx.AsyncClient()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
    await app.state.http.aclose()

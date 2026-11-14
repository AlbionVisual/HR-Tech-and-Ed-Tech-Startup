import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.db.connection import database
from app.core.db.schema import ensure_schema
from app.main import app


@pytest.fixture
async def client():
    database._settings = Settings(database_url="sqlite+aiosqlite:///:memory:")
    await database.start()
    await ensure_schema(database)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await database.stop()


async def test_create_and_login(client):
    r = await client.post(
        "/api/v1/profile/users",
        json={"username": "bob", "password": "secret123", "profile": {"x": 1}},
    )
    assert r.status_code == 200, r.text
    user = r.json()
    assert user["username"] == "bob"

    r = await client.post(
        "/api/v1/profile/login",
        json={"username": "bob", "password": "secret123"},
    )
    assert r.status_code == 200

    r = await client.post(
        "/api/v1/profile/login",
        json={"username": "bob", "password": "wrong"},
    )
    assert r.status_code == 401
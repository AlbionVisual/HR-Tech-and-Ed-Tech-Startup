import pytest

from app.core.config import Settings
from app.core.db.connection import Database
from app.core.db.schema import ensure_schema
from app.core.db.service import DbService


@pytest.fixture
async def db():
    settings = Settings(database_url="sqlite+aiosqlite:///:memory:")
    database = Database(settings)
    await database.start()
    await ensure_schema(database)
    yield database
    await database.stop()


async def test_create_and_authenticate(db):
    service = DbService(db)
    user = await service.create_user("alice", "secret123", {"role": "dev"})
    assert user.username == "alice"
    assert user.profile == {"role": "dev"}

    ok = await service.authenticate("alice", "secret123")
    assert ok is not None and ok.id == user.id

    bad = await service.authenticate("alice", "wrong")
    assert bad is None
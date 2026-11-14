from app.core.db.service import DbService


async def test_create_and_authenticate(db):
    service = DbService(db)
    user = await service.create_user("alice", "secret123", {"role": "dev"})
    assert user.username == "alice"
    assert user.profile == {"role": "dev"}

    ok = await service.authenticate("alice", "secret123")
    assert ok is not None and ok.id == user.id

    bad = await service.authenticate("alice", "wrong")
    assert bad is None

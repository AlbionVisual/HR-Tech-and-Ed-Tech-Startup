from datetime import datetime, timedelta, timezone

from app.modules.auth.repository import AuthRepository


async def test_identity_and_session(db):
    repository = AuthRepository(db)
    user, identity = await repository.get_or_create_identity(
        "google",
        "google-1",
        {
            "username": None,
            "display_name": "Alice",
            "avatar_url": "https://example.com/a.png",
            "email": "alice@example.com",
            "raw": {"sub": "google-1"},
        },
    )
    assert user.display_name == "Alice"
    assert identity.provider == "google"
    assert identity.provider_user_id == "google-1"

    same_user, same_identity = await repository.get_or_create_identity(
        "google",
        "google-1",
        {
            "username": None,
            "display_name": "Alice",
            "avatar_url": "https://example.com/a.png",
            "email": "alice@example.com",
            "raw": {"sub": "google-1"},
        },
    )
    assert same_user.id == user.id
    assert same_identity.id == identity.id

    session = await repository.create_session(
        user.id,
        "a" * 64,
        datetime.now(timezone.utc) + timedelta(days=1),
        "pytest",
        "127.0.0.1",
    )
    assert session.user_id == user.id
    assert await repository.get_session("a" * 64) is not None

    await repository.revoke_session("a" * 64, datetime.now(timezone.utc))
    revoked = await repository.get_session("a" * 64)
    assert revoked is not None and revoked.revoked_at is not None

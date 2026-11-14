from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select

from app.core.db.connection import Database
from app.core.db.models import AuthIdentity, AuthSession, User


class AuthRepository:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def get_user(self, user_id: UUID) -> User | None:
        async with self._db.session() as session:
            return await session.get(User, user_id)

    async def list_identities(self, user_id: UUID) -> list[AuthIdentity]:
        async with self._db.session() as session:
            rows = await session.scalars(
                select(AuthIdentity)
                .where(AuthIdentity.user_id == user_id)
                .order_by(AuthIdentity.created_at)
            )
            return list(rows.all())

    async def get_identity(
        self,
        provider: str,
        provider_user_id: str,
    ) -> AuthIdentity | None:
        async with self._db.session() as session:
            return await session.scalar(
                select(AuthIdentity).where(
                    AuthIdentity.provider == provider,
                    AuthIdentity.provider_user_id == provider_user_id,
                )
            )

    async def get_or_create_identity(
        self,
        provider: str,
        provider_user_id: str,
        data: dict[str, Any],
    ) -> tuple[User, AuthIdentity]:
        async with self._db.session() as session:
            identity = await session.scalar(
                select(AuthIdentity).where(
                    AuthIdentity.provider == provider,
                    AuthIdentity.provider_user_id == provider_user_id,
                )
            )

            if identity is not None:
                self._apply_identity(identity, data)
                user = await session.get(User, identity.user_id)
                if user is None:
                    raise RuntimeError("Identity points to a missing user")
                if not user.display_name and data.get("display_name"):
                    user.display_name = data["display_name"]
                if not user.avatar_url and data.get("avatar_url"):
                    user.avatar_url = data["avatar_url"]
                await session.flush()
                return user, identity

            user = User(
                display_name=data.get("display_name") or "",
                avatar_url=data.get("avatar_url"),
                profile={},
            )
            session.add(user)
            await session.flush()

            identity = AuthIdentity(
                user_id=user.id,
                provider=provider,
                provider_user_id=provider_user_id,
                raw=data.get("raw") or {},
            )
            self._apply_identity(identity, data)
            session.add(identity)
            await session.flush()
            return user, identity

    async def update_profile(
        self,
        user_id: UUID,
        *,
        display_name: str | None = None,
        avatar_url: str | None = None,
        profile: dict[str, Any] | None = None,
    ) -> User | None:
        async with self._db.session() as session:
            user = await session.get(User, user_id)
            if user is None:
                return None
            if display_name is not None:
                user.display_name = display_name
            if avatar_url is not None:
                user.avatar_url = avatar_url
            if profile is not None:
                user.profile = {**(user.profile or {}), **profile}
            await session.flush()
            return user

    async def create_session(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None,
        ip: str | None,
    ) -> AuthSession:
        async with self._db.session() as session:
            row = AuthSession(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                user_agent=user_agent,
                ip=ip,
            )
            session.add(row)
            await session.flush()
            return row

    async def get_session(self, token_hash: str) -> AuthSession | None:
        async with self._db.session() as session:
            return await session.scalar(
                select(AuthSession).where(AuthSession.token_hash == token_hash)
            )

    async def revoke_session(self, token_hash: str, revoked_at: datetime) -> None:
        async with self._db.session() as session:
            row = await session.scalar(
                select(AuthSession).where(AuthSession.token_hash == token_hash)
            )
            if row is not None and row.revoked_at is None:
                row.revoked_at = revoked_at
                await session.flush()

    @staticmethod
    def _apply_identity(identity: AuthIdentity, data: dict[str, Any]) -> None:
        identity.username = data.get("username")
        identity.display_name = data.get("display_name")
        identity.avatar_url = data.get("avatar_url")
        identity.email = data.get("email")
        identity.raw = data.get("raw") or {}

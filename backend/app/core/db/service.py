from typing import Any
from uuid import UUID

from sqlalchemy import select

from app.core.db.connection import Database
from app.core.db.models import User
from app.core.db.security import hash_password, verify_password


class DbService:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def create_user(
        self, username: str, password: str, profile: dict[str, Any] | None = None
    ) -> User:
        password_hash, salt = hash_password(password)
        async with self._db.session() as session:
            user = User(
                username=username,
                password_hash=password_hash,
                salt=salt,
                profile=profile or {},
            )
            session.add(user)
            await session.flush()
            return user

    async def get_user(self, user_id: UUID) -> User | None:
        async with self._db.session() as session:
            return await session.get(User, user_id)

    async def get_user_by_username(self, username: str) -> User | None:
        async with self._db.session() as session:
            return await session.scalar(select(User).where(User.username == username))

    async def authenticate(self, username: str, password: str) -> User | None:
        user = await self.get_user_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.salt, user.password_hash):
            return None
        return user

    async def update_profile(self, user_id: UUID, profile: dict[str, Any]) -> User | None:
        async with self._db.session() as session:
            user = await session.get(User, user_id)
            if user is None:
                return None
            user.profile = {**(user.profile or {}), **profile}
            await session.flush()
            return user
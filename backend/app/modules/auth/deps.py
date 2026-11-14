from uuid import UUID

from fastapi import Depends, HTTPException, Request

from app.core.config import settings
from app.core.db.connection import database
from app.core.db.models import User
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService


def get_auth_repository() -> AuthRepository:
    return AuthRepository(database)


def get_auth_service(
    request: Request,
    repository: AuthRepository = Depends(get_auth_repository),
) -> AuthService:
    return AuthService(
        settings,
        getattr(request.app.state, "http", None),
        repository,
    )


async def get_current_user(
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    user = await service.current_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def get_current_user_id(
    user: User = Depends(get_current_user),
) -> UUID:
    return user.id

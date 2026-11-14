from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.v1.deps import get_db_service
from app.core.db.service import DbService

router = APIRouter()


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    profile: dict = Field(default_factory=dict)


class UserLogin(BaseModel):
    username: str
    password: str


class ProfilePatch(BaseModel):
    profile: dict = Field(default_factory=dict)


def _public(user) -> dict:
    return {"id": str(user.id), "username": user.username, "profile": user.profile or {}}


@router.post("/users")
async def create_user(
    payload: UserCreate,
    db: DbService = Depends(get_db_service),
) -> dict:
    existing = await db.get_user_by_username(payload.username)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Username already taken")
    user = await db.create_user(payload.username, payload.password, payload.profile)
    return _public(user)


@router.post("/login")
async def login(
    payload: UserLogin,
    db: DbService = Depends(get_db_service),
) -> dict:
    user = await db.authenticate(payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return _public(user)


@router.get("/users/{user_id}")
async def get_user(
    user_id: UUID,
    db: DbService = Depends(get_db_service),
) -> dict:
    user = await db.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _public(user)


@router.patch("/users/{user_id}/profile")
async def update_profile(
    user_id: UUID,
    payload: ProfilePatch,
    db: DbService = Depends(get_db_service),
) -> dict:
    user = await db.update_profile(user_id, payload.profile)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _public(user)
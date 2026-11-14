from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=10)


class IdentityOut(BaseModel):
    provider: str
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    email: str | None = None


class UserOut(BaseModel):
    id: UUID
    display_name: str
    avatar_url: str | None = None
    profile: dict[str, Any] = Field(default_factory=dict)
    identities: list[IdentityOut] = Field(default_factory=list)


class ProfilePatch(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    profile: dict[str, Any] | None = None

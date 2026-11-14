from fastapi import APIRouter, Depends, HTTPException

from app.core.db.models import User
from app.modules.auth.deps import get_auth_service, get_current_user
from app.modules.auth.schemas import ProfilePatch, UserOut
from app.modules.auth.service import AuthService

router = APIRouter()


@router.get("", response_model=UserOut)
async def get_profile(
    user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> UserOut:
    return await service.user_payload(user)


@router.patch("", response_model=UserOut)
async def update_profile(
    payload: ProfilePatch,
    user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> UserOut:
    result = await service.update_profile(
        user.id,
        display_name=payload.display_name,
        avatar_url=payload.avatar_url,
        profile=payload.profile,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

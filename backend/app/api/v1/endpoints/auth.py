from urllib.parse import quote

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.db.models import User
from app.modules.auth.deps import get_auth_service, get_current_user
from app.modules.auth.errors import AuthError
from app.modules.auth.providers.telegram import TELEGRAM_STATE_COOKIE
from app.modules.auth.schemas import GoogleLoginRequest, UserOut
from app.modules.auth.service import AuthService


router = APIRouter()


@router.post("/google", response_model=UserOut)
async def login_google(
    payload: GoogleLoginRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> UserOut:
    user, token = await service.login_google(payload.credential, request)
    service.set_session_cookie(response, token)
    return await service.user_payload(user)


@router.get("/telegram/start")
async def telegram_start(
    service: AuthService = Depends(get_auth_service),
) -> RedirectResponse:
    url, state_cookie = await service.telegram_start()
    response = RedirectResponse(url)
    service.set_state_cookie(response, state_cookie)
    return response


@router.get("/telegram/callback")
async def telegram_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    service: AuthService = Depends(get_auth_service),
) -> RedirectResponse:
    state_cookie = request.cookies.get(TELEGRAM_STATE_COOKIE)
    if not state_cookie:
        return _login_redirect("telegram_state_missing")
    try:
        user, token = await service.login_telegram(
            code,
            state,
            state_cookie,
            request,
        )
    except AuthError:
        return _login_redirect("telegram_failed")

    response = RedirectResponse(settings.app_public_url)
    service.set_session_cookie(response, token)
    service.clear_state_cookie(response)
    return response


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> Response:
    token = request.cookies.get(settings.session_cookie_name)
    await service.logout(token)
    service.clear_session_cookie(response)
    response.status_code = 204
    return response


@router.get("/me", response_model=UserOut)
async def me(
    user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> UserOut:
    return await service.user_payload(user)


def _login_redirect(reason: str) -> RedirectResponse:
    url = f"{settings.app_public_url}?auth_error={quote(reason)}"
    return RedirectResponse(url)

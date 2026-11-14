import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import httpx
from fastapi import Request, Response

from app.core.config import Settings
from app.core.db.models import User
from app.modules.auth.errors import AuthError
from app.modules.auth.providers.google import (
    GOOGLE_JWKS_URL,
    verify_google_id_token,
)
from app.modules.auth.providers.jwks import JwksCache
from app.modules.auth.providers.telegram import (
    TELEGRAM_JWKS_URL,
    TELEGRAM_STATE_COOKIE,
    build_auth_url,
    decode_state,
    encode_state,
    exchange_code,
    pkce_pair,
    verify_telegram_id_token,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import IdentityOut, UserOut


class AuthService:
    def __init__(
        self,
        settings: Settings,
        http: httpx.AsyncClient,
        repository: AuthRepository,
    ) -> None:
        self._settings = settings
        self._http = http
        self._repository = repository
        self._google_jwks = JwksCache(GOOGLE_JWKS_URL, http)
        self._telegram_jwks = JwksCache(TELEGRAM_JWKS_URL, http)

    async def login_google(
        self,
        credential: str,
        request: Request,
    ) -> tuple[User, str]:
        payload = await verify_google_id_token(
            credential,
            self._settings.google_client_id,
            self._google_jwks,
        )
        data = {
            "username": None,
            "display_name": (
                payload.get("name")
                or payload.get("email")
                or "Google account"
            ),
            "avatar_url": payload.get("picture"),
            "email": payload.get("email"),
            "raw": payload,
        }
        user, _ = await self._repository.get_or_create_identity(
            "google",
            str(payload["sub"]),
            data,
        )
        token = await self._issue_session(user.id, request)
        return user, token

    async def login_telegram(
        self,
        code: str,
        state: str,
        state_cookie: str,
        request: Request,
    ) -> tuple[User, str]:
        expected_state, verifier = decode_state(
            self._settings.session_secret,
            state_cookie,
        )
        if not secrets.compare_digest(expected_state, state):
            raise AuthError("Invalid Telegram state")

        id_token = await exchange_code(
            self._http,
            self._settings.telegram_client_id,
            self._settings.telegram_client_secret,
            self._settings.telegram_redirect_uri,
            code,
            verifier,
        )
        payload = await verify_telegram_id_token(
            id_token,
            self._settings.telegram_client_id,
            self._telegram_jwks,
        )
        data = {
            "username": payload.get("preferred_username"),
            "display_name": (
                payload.get("name")
                or payload.get("preferred_username")
                or "Telegram account"
            ),
            "avatar_url": payload.get("picture"),
            "email": payload.get("email"),
            "raw": payload,
        }
        user, _ = await self._repository.get_or_create_identity(
            "telegram",
            str(payload["sub"]),
            data,
        )
        token = await self._issue_session(user.id, request)
        return user, token

    async def telegram_start(self) -> tuple[str, str]:
        state = secrets.token_urlsafe(24)
        verifier, challenge = pkce_pair()
        url = build_auth_url(
            self._settings.telegram_client_id,
            self._settings.telegram_redirect_uri,
            state,
            challenge,
        )
        state_cookie = encode_state(
            self._settings.session_secret,
            state,
            verifier,
        )
        return url, state_cookie

    async def current_user(self, token: str | None) -> User | None:
        if not token:
            return None
        token_hash = self._hash_token(token)
        row = await self._repository.get_session(token_hash)
        if row is None or row.revoked_at is not None:
            return None
        expires_at = row.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            return None
        return await self._repository.get_user(row.user_id)

    async def logout(self, token: str | None) -> None:
        if token:
            await self._repository.revoke_session(
                self._hash_token(token),
                datetime.now(timezone.utc),
            )

    async def user_payload(self, user: User) -> UserOut:
        identities = await self._repository.list_identities(user.id)
        return UserOut(
            id=user.id,
            display_name=user.display_name or "",
            avatar_url=user.avatar_url,
            profile=user.profile or {},
            identities=[
                IdentityOut(
                    provider=item.provider,
                    username=item.username,
                    display_name=item.display_name,
                    avatar_url=item.avatar_url,
                    email=item.email,
                )
                for item in identities
            ],
        )

    async def update_profile(
        self,
        user_id: UUID,
        *,
        display_name: str | None,
        avatar_url: str | None,
        profile: dict[str, Any] | None,
    ) -> UserOut | None:
        user = await self._repository.update_profile(
            user_id,
            display_name=display_name,
            avatar_url=avatar_url,
            profile=profile,
        )
        if user is None:
            return None
        return await self.user_payload(user)

    def set_session_cookie(self, response: Response, token: str) -> None:
        response.set_cookie(
            key=self._settings.session_cookie_name,
            value=token,
            max_age=self._settings.session_ttl_days * 86_400,
            httponly=True,
            secure=self._settings.cookie_secure,
            samesite=self._settings.cookie_samesite,
            path="/",
        )

    def clear_session_cookie(self, response: Response) -> None:
        response.delete_cookie(self._settings.session_cookie_name, path="/")

    def set_state_cookie(self, response: Response, value: str) -> None:
        response.set_cookie(
            key=TELEGRAM_STATE_COOKIE,
            value=value,
            max_age=600,
            httponly=True,
            secure=self._settings.cookie_secure,
            samesite="lax",
            path="/",
        )

    def clear_state_cookie(self, response: Response) -> None:
        response.delete_cookie(TELEGRAM_STATE_COOKIE, path="/")

    async def _issue_session(self, user_id: UUID, request: Request) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=self._settings.session_ttl_days
        )
        await self._repository.create_session(
            user_id,
            self._hash_token(token),
            expires_at,
            request.headers.get("user-agent", "")[:255] or None,
            request.client.host if request.client else None,
        )
        return token

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
import jwt

from app.modules.auth.errors import AuthConfigError, AuthError
from app.modules.auth.providers.jwks import JwksCache


TELEGRAM_AUTH_URL = "https://oauth.telegram.org/auth"
TELEGRAM_TOKEN_URL = "https://oauth.telegram.org/token"
TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json"
TELEGRAM_ISSUER = "https://oauth.telegram.org"
TELEGRAM_STATE_COOKIE = "telegram_state"


def pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("ascii")).digest()
    ).rstrip(b"=")
    return verifier, challenge.decode("ascii")


def encode_state(secret: str, state: str, verifier: str) -> str:
    return jwt.encode(
        {
            "state": state,
            "verifier": verifier,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        },
        secret,
        algorithm="HS256",
    )


def decode_state(secret: str, token: str) -> tuple[str, str]:
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except Exception as exc:
        raise AuthError("Invalid Telegram state") from exc
    state = payload.get("state")
    verifier = payload.get("verifier")
    if not state or not verifier:
        raise AuthError("Invalid Telegram state")
    return state, verifier


def build_auth_url(
    client_id: str,
    redirect_uri: str,
    state: str,
    challenge: str,
) -> str:
    if not client_id:
        raise AuthConfigError("Telegram auth is not configured")
    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid profile",
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return f"{TELEGRAM_AUTH_URL}?{query}"


async def exchange_code(
    http: httpx.AsyncClient,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    code: str,
    verifier: str,
) -> str:
    if not client_id or not client_secret:
        raise AuthConfigError("Telegram auth is not configured")

    response = await http.post(
        TELEGRAM_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "code_verifier": verifier,
        },
        auth=(client_id, client_secret),
    )
    if response.status_code != 200:
        raise AuthError("Telegram code exchange failed")
    payload = response.json()
    token = payload.get("id_token")
    if not token:
        raise AuthError("Telegram returned no id_token")
    return token


async def verify_telegram_id_token(
    token: str,
    client_id: str,
    jwks: JwksCache,
) -> dict:
    if not client_id:
        raise AuthConfigError("Telegram auth is not configured")

    try:
        key = await jwks.key_for(token)
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=str(client_id),
            issuer=TELEGRAM_ISSUER,
            options={"require": ["exp", "iat", "sub"]},
        )
    except Exception as exc:
        raise AuthError("Invalid Telegram token") from exc

    if not payload.get("sub"):
        raise AuthError("Telegram token has no subject")
    return payload

import jwt

from app.modules.auth.errors import AuthConfigError, AuthError
from app.modules.auth.providers.jwks import JwksCache


GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")


async def verify_google_id_token(
    token: str,
    client_id: str,
    jwks: JwksCache,
) -> dict:
    if not client_id:
        raise AuthConfigError("Google auth is not configured")

    try:
        key = await jwks.key_for(token)
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=GOOGLE_ISSUERS,
            options={"require": ["exp", "iat", "sub"]},
        )
    except Exception as exc:
        raise AuthError("Invalid Google token") from exc

    if not payload.get("sub"):
        raise AuthError("Google token has no subject")
    return payload

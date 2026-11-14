import json
import time

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm


class JwksCache:
    def __init__(self, url: str, http: httpx.AsyncClient, ttl: int = 3600) -> None:
        self._url = url
        self._http = http
        self._ttl = ttl
        self._keys: dict[str, dict] = {}
        self._expires_at = 0.0

    async def key_for(self, token: str):
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise ValueError("Token has no kid")

        if time.monotonic() >= self._expires_at or kid not in self._keys:
            await self._refresh()

        item = self._keys.get(kid)
        if item is None:
            raise ValueError("Unknown signing key")
        return RSAAlgorithm.from_jwk(json.dumps(item))

    async def _refresh(self) -> None:
        response = await self._http.get(self._url)
        response.raise_for_status()
        payload = response.json()
        self._keys = {
            item["kid"]: item
            for item in payload.get("keys", [])
            if isinstance(item, dict) and item.get("kid")
        }
        self._expires_at = time.monotonic() + self._ttl

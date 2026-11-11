from urllib.parse import quote

import httpx

from app.core.ai.catalog import PROVIDER_CATALOG
from app.core.ai.errors import LOCATION_TOKENS, humanize_error, probe_error
from app.core.config import Settings


async def probe_gemini(
    settings: Settings,
    http: httpx.AsyncClient | None,
    provider: str,
) -> dict:
    if provider != "gemini":
        return probe_error("unsupported", "Проверка доступна только для Gemini")
    if not settings.gemini_api_key:
        return probe_error("no_key", "Нет ключа Gemini на сервере")
    if http is None:
        return probe_error("error", "HTTP-клиент не инициализирован")

    model = PROVIDER_CATALOG["gemini"].default_model
    url = (
        f"{settings.gemini_base_url}/models/{model}:generateContent"
        f"?key={quote(settings.gemini_api_key)}"
    )
    try:
        response = await http.post(
            url,
            json={
                "contents": [{"parts": [{"text": "ping"}]}],
                "generationConfig": {"maxOutputTokens": 1, "temperature": 0},
            },
            timeout=20.0,
        )
    except httpx.HTTPError:
        return probe_error("network", "Сеть до Gemini не отвечает")

    if response.is_success:
        return {"ok": True}
    body = response.text
    lower = body.lower()
    blocked = (
        any(token in lower for token in LOCATION_TOKENS)
        or (response.status_code == 403 and "location" in lower)
        or ("region" in lower and "not" in lower)
    )
    return {
        "ok": False,
        "reason": "blocked" if blocked else "error",
        "message": humanize_error(response.status_code, body),
    }

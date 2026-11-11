import json


class AiRequestError(Exception):
    pass


RATE_TOKENS = ("resource_exhausted", "quota", "rate limit", "too many requests")
LOCATION_TOKENS = ("user location", "location is not supported", "failed_precondition")


def humanize_error(status: int, body: str) -> str:
    lower = body.lower()

    if status == 429 or any(token in lower for token in RATE_TOKENS):
        return "Лимит запросов исчерпан или слишком частые вызовы. Подождите и попробуйте снова."

    if any(token in lower for token in LOCATION_TOKENS):
        return "Похоже, Gemini из этой сети недоступен. Попробуйте «телепортироваться в другую страну» (VPN) и обновить страницу."

    if status in (401, 403):
        return "Ключ отклонён или нет доступа к модели. Проверьте API-ключ на сервере."

    if status == 402:
        return "Недостаточно кредитов на OpenRouter (402). Пополните баланс или выберите :free модель."

    if status == 404:
        return "Модель не найдена. Проверьте название модели в конфиге."

    try:
        message = (json.loads(body).get("error") or {}).get("message")
    except (json.JSONDecodeError, AttributeError):
        message = None
    return str(message) if message else (body.strip()[:500] or f"Ошибка API ({status or '?'})")


def probe_error(reason: str, message: str) -> dict:
    return {"ok": False, "reason": reason, "message": message}

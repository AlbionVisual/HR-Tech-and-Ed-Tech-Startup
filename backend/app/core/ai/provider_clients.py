import asyncio
from typing import AsyncIterator
from urllib.parse import quote

import httpx

from app.core.ai.parsing import parse_gemini_chunk, parse_openai_chunk
from app.core.ai.providers import AiProvider, read_sse, require_http, split_text
from app.core.config import Settings


class GeminiProvider:
    def __init__(self, http: httpx.AsyncClient | None, settings: Settings) -> None:
        self._http = http
        self._settings = settings

    async def stream(
        self, *, system: str, messages: list[dict[str, str]],
        model: str, api_key: str,
    ) -> AsyncIterator[dict]:
        http = require_http(self._http)
        url = (
            f"{self._settings.gemini_base_url}/models/{model}:streamGenerateContent"
            f"?alt=sse&key={quote(api_key)}"
        )
        body = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [
                {
                    "role": "model" if message["role"] == "assistant" else "user",
                    "parts": [{"text": message["content"]}],
                }
                for message in messages
            ],
            "generationConfig": {"thinkingConfig": {"includeThoughts": True}},
        }
        async for event in read_sse(http, url, body, parse_gemini_chunk):
            yield event


class OpenAICompatProvider:
    def __init__(
        self,
        http: httpx.AsyncClient | None,
        base_url: str,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self._http = http
        self._base_url = base_url.rstrip("/")
        self._extra_headers = extra_headers or {}

    async def stream(
        self, *, system: str, messages: list[dict[str, str]],
        model: str, api_key: str,
    ) -> AsyncIterator[dict]:
        http = require_http(self._http)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            **self._extra_headers,
        }
        body = {
            "model": model,
            "stream": True,
            "messages": [{"role": "system", "content": system}, *messages],
        }
        async for event in read_sse(
            http,
            f"{self._base_url}/chat/completions",
            body,
            parse_openai_chunk,
            headers,
        ):
            yield event


RESUME_REPLY = (
    "Краткий вердикт: резюме читается, но ему не хватает измеримых результатов.\n\n"
    "Сильные стороны:\n"
    "- Понятный стек технологий.\n"
    "- Есть релевантный опыт.\n\n"
    "Критичные проблемы:\n"
    "- Достижения описаны без метрик.\n"
    "- Не хватает ключевых слов под целевую роль.\n\n"
    "План исправлений:\n"
    "1. Добавить измеримые результаты.\n"
    "2. Усилить формулировки опыта.\n"
    "3. Проверить ATS-структуру."
)
FIRST_REPLY = "Здравствуйте! Я интервьюер. Расскажите о себе и о последнем проекте."
FOLLOW_UP_REPLY = (
    "Спасибо за ответ. Хорошо раскрыта техническая часть, "
    "но не хватает конкретных метрик."
)


class MockProvider:
    async def stream(
        self, *, system: str, messages: list[dict[str, str]],
        model: str, api_key: str,
    ) -> AsyncIterator[dict]:
        await asyncio.sleep(0.15)
        yield {"type": "thought", "text": "Готовлю ответ...\n"}
        await asyncio.sleep(0.15)

        last = messages[-1] if messages else {"role": "user", "content": ""}
        content = str(last.get("content") or "")
        is_first = len(messages) <= 1
        is_next = "следующий" in content.lower()
        is_resume = "резюме" in system.lower()
        if is_resume:
            text = RESUME_REPLY
        elif is_first or is_next:
            text = FIRST_REPLY
        else:
            text = FOLLOW_UP_REPLY

        for piece in split_text(text):
            await asyncio.sleep(0.02)
            yield {"type": "delta", "text": piece}

        yield {"type": "progress", "value": min(100, 25 * max(1, len(messages) // 2))}
        if (is_resume and len(messages) > 2) or (
            not is_resume and not is_first and not is_next
        ):
            yield {"type": "feedback"}


def build_provider(
    provider: str,
    http: httpx.AsyncClient | None,
    settings: Settings,
) -> AiProvider:
    if provider == "gemini":
        return GeminiProvider(http, settings)
    if provider == "openrouter":
        return OpenAICompatProvider(
            http,
            settings.openrouter_base_url,
            {
                "HTTP-Referer": settings.openrouter_site_url,
                "X-Title": settings.openrouter_app_name,
            },
        )
    if provider == "aiai":
        return OpenAICompatProvider(http, settings.aiai_base_url)
    return MockProvider()

import asyncio
import json
from dataclasses import dataclass
from typing import AsyncIterator, Protocol
from urllib.parse import quote

import httpx

from app.core.ai.prompts import FIRST_USER_KICKOFF
from app.core.config import Settings


class ProviderError(Exception):
    def __init__(self, status: int, body: str) -> None:
        super().__init__(body)
        self.status = status
        self.body = body


class AiProvider(Protocol):
    def stream(
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        model: str,
        api_key: str,
    ) -> AsyncIterator[dict]: ...


@dataclass(frozen=True)
class ModelDef:
    id: str
    label: str


@dataclass(frozen=True)
class ProviderDef:
    label: str
    models: tuple[ModelDef, ...]
    default_model: str


PROVIDER_CATALOG: dict[str, ProviderDef] = {
    "openrouter": ProviderDef(
        label="OpenRouter",
        models=(
            ModelDef("nvidia/nemotron-3-ultra-550b-a55b:free", "Nemotron 3 Ultra 550B"),
            ModelDef("dots-studio/dots-3-note-preview:free", "Dots 3 Note Preview"),
            ModelDef("nvidia/nemotron-3-super-120b-a12b:free", "Nemotron 3 Super 120B"),
            ModelDef("cohere/north-mini-code:free", "North Mini Code"),
        ),
        default_model="nvidia/nemotron-3-ultra-550b-a55b:free",
    ),
    "gemini": ProviderDef(
        label="Gemini",
        models=(
            ModelDef("gemini-3.5-flash-lite", "Gemini 3.5 Flash Lite"),
            ModelDef("gemini-3.8-flash", "Gemini 3.8 Flash"),
        ),
        default_model="gemini-3.5-flash-lite",
    ),
    "aiai": ProviderDef(
        label="AIAI",
        models=(
            ModelDef("gemini-3.5-flash-lite", "Gemini 3.5 Flash Lite"),
            ModelDef("deepseek-v4.1-flash", "DeepSeek V4.1 Flash"),
        ),
        default_model="gemini-3.5-flash-lite",
    ),
    "mock": ProviderDef(
        label="Локально",
        models=(ModelDef("demo", "Демо"),),
        default_model="demo",
    ),
}


def split_text(text: str, size: int = 18) -> list[str]:
    return [text[index : index + size] for index in range(0, len(text), size)]


def sse_payload(line: str) -> str | None:
    line = line.strip()
    if not line.startswith("data:"):
        return None
    data = line[5:].strip()
    if not data or data == "[DONE]":
        return None
    return data


def parse_gemini_chunk(item: dict) -> list[dict]:
    error = item.get("error")
    if isinstance(error, dict) and error.get("message"):
        return [{"type": "error", "message": str(error["message"])}]

    feedback = item.get("promptFeedback") or {}
    if feedback.get("blockReason"):
        return [{"type": "error", "message": f"Запрос заблокирован: {feedback['blockReason']}"}]

    candidates = item.get("candidates") or []
    if not candidates:
        return []

    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    thought = "".join(
        str(part.get("text") or "")
        for part in parts
        if part.get("text") and part.get("thought")
    )
    answer = "".join(
        str(part.get("text") or "")
        for part in parts
        if part.get("text") and not part.get("thought")
    )

    finish = candidate.get("finishReason")
    if (
        not answer
        and not thought
        and finish
        and finish not in ("STOP", "MAX_TOKENS", "FINISH_REASON_UNSPECIFIED")
    ):
        return [{"type": "error", "message": f"Ответ остановлен: {finish}"}]

    events: list[dict] = []
    if thought:
        events.append({"type": "thought", "text": thought})
    if answer:
        events.append({"type": "delta", "text": answer})
    return events


def parse_openai_chunk(payload: dict) -> list[dict]:
    error = payload.get("error")
    if isinstance(error, dict) and error.get("message"):
        return [{"type": "error", "message": str(error["message"])}]

    choices = payload.get("choices") or []
    if not choices:
        return []

    delta = choices[0].get("delta") or {}
    events: list[dict] = []
    reasoning = delta.get("reasoning")
    content = delta.get("content")
    if reasoning:
        events.append({"type": "thought", "text": str(reasoning)})
    if content:
        events.append({"type": "delta", "text": str(content)})
    return events


class GeminiProvider:
    def __init__(self, http: httpx.AsyncClient | None, settings: Settings) -> None:
        self._http = http
        self._settings = settings

    async def stream(
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        model: str,
        api_key: str,
    ) -> AsyncIterator[dict]:
        if self._http is None:
            raise ProviderError(500, "HTTP-клиент не инициализирован")

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

        async with self._http.stream("POST", url, json=body) as response:
            if response.status_code >= 400:
                text = (await response.aread()).decode("utf-8", "replace")
                raise ProviderError(response.status_code, text)

            async for line in response.aiter_lines():
                data = sse_payload(line)
                if data is None:
                    continue
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue
                items = payload if isinstance(payload, list) else [payload]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    for event in parse_gemini_chunk(item):
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
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        model: str,
        api_key: str,
    ) -> AsyncIterator[dict]:
        if self._http is None:
            raise ProviderError(500, "HTTP-клиент не инициализирован")

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

        async with self._http.stream(
            "POST",
            f"{self._base_url}/chat/completions",
            json=body,
            headers=headers,
        ) as response:
            if response.status_code >= 400:
                text = (await response.aread()).decode("utf-8", "replace")
                raise ProviderError(response.status_code, text)

            async for line in response.aiter_lines():
                data = sse_payload(line)
                if data is None:
                    continue
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if not isinstance(payload, dict):
                    continue
                for event in parse_openai_chunk(payload):
                    yield event


class MockProvider:
    async def stream(
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        model: str,
        api_key: str,
    ) -> AsyncIterator[dict]:
        await asyncio.sleep(0.15)
        yield {"type": "thought", "text": "Готовлю ответ...\n"}
        await asyncio.sleep(0.15)

        last = messages[-1] if messages else {"role": "user", "content": ""}
        content = str(last.get("content") or "")
        is_first = len(messages) <= 1
        is_next = "следующий" in content.lower()

        if is_first or is_next:
            text = "Здравствуйте! Я интервьюер. Расскажите о себе и о последнем проекте."
        else:
            text = "Спасибо за ответ. Хорошо раскрыта техническая часть, но не хватает конкретных метрик."

        for piece in split_text(text):
            await asyncio.sleep(0.02)
            yield {"type": "delta", "text": piece}

        yield {"type": "progress", "value": min(100, 25 * max(1, len(messages) // 2))}
        if not is_first and not is_next:
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

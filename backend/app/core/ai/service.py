import asyncio
import json
from dataclasses import dataclass
from typing import AsyncIterator, Literal
from urllib.parse import quote

import httpx
from pydantic import BaseModel, Field

from app.core.ai.prompts import (
    FEEDBACK_MARKER,
    FIRST_USER_KICKOFF,
    PROGRESS_START,
    RESUME_MODES,
    VacancyContext,
    build_interview_system_prompt,
    build_resume_system_prompt,
)
from app.core.ai.providers import PROVIDER_CATALOG, ProviderError, build_provider
from app.core.config import Settings


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    task: Literal["interview", "resume"]
    mode: str
    vacancy: VacancyContext | None = None
    messages: list[ChatMessage] = Field(default_factory=list)
    provider: str | None = None
    model: str | None = None


class AiRequestError(Exception):
    pass


@dataclass
class PreparedChat:
    provider: str
    model: str
    api_key: str
    system: str
    messages: list[dict[str, str]]


class MarkerFilter:
    def __init__(self) -> None:
        self._buffer = ""
        self._last_char = ""
        self._feedback = False

    def feed(self, text: str) -> list[dict]:
        self._buffer += text
        events: list[dict] = []

        while self._buffer:
            index = self._buffer.find("[[")
            if index < 0:
                keep = self._partial_len(self._buffer)
                safe = self._buffer[:-keep] if keep else self._buffer
                if safe:
                    self._emit(safe, events)
                    self._buffer = self._buffer[len(safe) :]
                break

            if index > 0:
                self._emit(self._buffer[:index], events)
                self._buffer = self._buffer[index:]
                continue

            if len(self._buffer) < len(FEEDBACK_MARKER) and FEEDBACK_MARKER.startswith(
                self._buffer
            ):
                break
            if len(self._buffer) < len(PROGRESS_START) and PROGRESS_START.startswith(
                self._buffer
            ):
                break

            if self._buffer.startswith(FEEDBACK_MARKER):
                self._buffer = self._buffer[len(FEEDBACK_MARKER) :]
                self._feedback = True
                continue

            if self._buffer.startswith(PROGRESS_START):
                end = self._buffer.find("]]", len(PROGRESS_START))
                if end < 0:
                    break
                raw = self._buffer[len(PROGRESS_START) : end].strip()
                self._buffer = self._buffer[end + 2 :]
                try:
                    value = max(0, min(100, round(float(raw))))
                except ValueError:
                    continue
                events.append({"type": "progress", "value": value})
                continue

            self._emit("[[", events)
            self._buffer = self._buffer[2:]

        return events

    def flush(self) -> list[dict]:
        events: list[dict] = []
        if self._buffer and not self._is_partial_marker(self._buffer):
            self._emit(self._buffer, events)
        self._buffer = ""
        if self._feedback and self._last_char not in ("?", "？"):
            events.append({"type": "feedback"})
        self._feedback = False
        return events

    @staticmethod
    def _is_partial_marker(text: str) -> bool:
        if not text.startswith("["):
            return False
        return (
            FEEDBACK_MARKER.startswith(text)
            or PROGRESS_START.startswith(text)
            or text.startswith(PROGRESS_START)
            or text.startswith(FEEDBACK_MARKER)
        )

    def _emit(self, text: str, events: list[dict]) -> None:
        if not text:
            return
        events.append({"type": "delta", "text": text})
        stripped = text.rstrip()
        if stripped:
            self._last_char = stripped[-1]

    @staticmethod
    def _partial_len(text: str) -> int:
        for marker in (FEEDBACK_MARKER, PROGRESS_START):
            for size in range(len(marker), 0, -1):
                if text[-size:] == marker[:size]:
                    return size
        return 0


def sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def humanize_error(status: int, body: str) -> str:
    lower = body.lower()

    if status == 429 or any(
        token in lower
        for token in ("resource_exhausted", "quota", "rate limit", "too many requests")
    ):
        return "Лимит запросов исчерпан или слишком частые вызовы. Подождите и попробуйте снова."

    if any(
        token in lower
        for token in ("user location", "location is not supported", "failed_precondition")
    ):
        return "Похоже, Gemini из этой сети недоступен. Попробуйте «телепортироваться в другую страну» (VPN) и обновить страницу."

    if status in (401, 403):
        return "Ключ отклонён или нет доступа к модели. Проверьте API-ключ на сервере."

    if status == 402:
        return "Недостаточно кредитов на OpenRouter (402). Пополните баланс или выберите :free модель."

    if status == 404:
        return "Модель не найдена. Проверьте название модели в конфиге."

    try:
        payload = json.loads(body)
        message = (payload.get("error") or {}).get("message")
        if message:
            return str(message)
    except (json.JSONDecodeError, AttributeError):
        pass

    trimmed = body.strip()
    if trimmed:
        return trimmed[:500]
    return f"Ошибка API ({status or '?'})"


class AiChatService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient | None = None) -> None:
        self.settings = settings
        self.http = http

    def available_providers(self) -> list[str]:
        providers = [
            provider
            for provider in ("openrouter", "gemini", "aiai")
            if self.settings.api_key_for(provider)
        ]
        providers.append("mock")
        return providers

    def prepare(self, payload: ChatRequest) -> PreparedChat:
        if payload.task == "interview":
            if payload.mode not in ("practice", "vacancy"):
                raise AiRequestError("Неизвестный режим интервью")
        elif payload.mode not in RESUME_MODES:
            raise AiRequestError("Неизвестный режим резюме")

        if payload.task == "resume" and not payload.messages:
            raise AiRequestError("Для анализа резюме нужен текст резюме")

        if len(payload.messages) > self.settings.ai_max_messages:
            raise AiRequestError("Слишком длинная история сообщений")

        for message in payload.messages:
            if len(message.content) > self.settings.ai_max_message_chars:
                raise AiRequestError("Сообщение слишком длинное")

        provider, model, api_key = self._resolve(payload.provider, payload.model)

        if payload.task == "interview":
            system = build_interview_system_prompt(payload.mode, payload.vacancy)
        else:
            system = build_resume_system_prompt(payload.mode)

        messages = [message.model_dump() for message in payload.messages]
        if payload.task == "interview" and not messages:
            messages = [{"role": "user", "content": FIRST_USER_KICKOFF}]

        return PreparedChat(
            provider=provider,
            model=model,
            api_key=api_key,
            system=system,
            messages=messages,
        )

    def models_payload(self) -> dict:
        available = self.available_providers()
        default_provider = self.settings.ai_default_provider
        if default_provider not in available:
            default_provider = available[0]

        return {
            "providers": [
                {
                    "id": provider,
                    "label": PROVIDER_CATALOG[provider].label,
                    "models": [
                        {"id": model.id, "label": model.label}
                        for model in PROVIDER_CATALOG[provider].models
                    ],
                }
                for provider in available
            ],
            "default": {
                "provider": default_provider,
                "model": PROVIDER_CATALOG[default_provider].default_model,
            },
        }

    async def stream(self, prepared: PreparedChat) -> AsyncIterator[str]:
        yield sse({"type": "thinking"})
        marker = MarkerFilter()
        provider = build_provider(prepared.provider, self.http, self.settings)

        try:
            async for event in provider.stream(
                system=prepared.system,
                messages=prepared.messages,
                model=prepared.model,
                api_key=prepared.api_key,
            ):
                kind = event.get("type")
                if kind == "delta":
                    for item in marker.feed(str(event.get("text") or "")):
                        yield sse(item)
                elif kind == "error":
                    yield sse(event)
                    return
                else:
                    yield sse(event)

            for item in marker.flush():
                yield sse(item)
            yield sse({"type": "done"})
        except ProviderError as error:
            yield sse({"type": "error", "message": humanize_error(error.status, error.body)})
        except asyncio.CancelledError:
            raise
        except Exception as error:
            yield sse({"type": "error", "message": str(error) or "Ошибка запроса"})

    async def probe(self, provider: str) -> dict:
        if provider != "gemini":
            return {
                "ok": False,
                "reason": "unsupported",
                "message": "Проверка доступна только для Gemini",
            }

        if not self.settings.gemini_api_key:
            return {
                "ok": False,
                "reason": "no_key",
                "message": "Нет ключа Gemini на сервере",
            }

        if self.http is None:
            return {
                "ok": False,
                "reason": "error",
                "message": "HTTP-клиент не инициализирован",
            }

        model = PROVIDER_CATALOG["gemini"].default_model
        url = (
            f"{self.settings.gemini_base_url}/models/{model}:generateContent"
            f"?key={quote(self.settings.gemini_api_key)}"
        )

        try:
            response = await self.http.post(
                url,
                json={
                    "contents": [{"parts": [{"text": "ping"}]}],
                    "generationConfig": {"maxOutputTokens": 1, "temperature": 0},
                },
                timeout=20.0,
            )
        except httpx.HTTPError:
            return {
                "ok": False,
                "reason": "network",
                "message": "Сеть до Gemini не отвечает",
            }

        if response.is_success:
            return {"ok": True}

        body = response.text
        lower = body.lower()
        blocked = (
            "user location" in lower
            or "location is not supported" in lower
            or "failed_precondition" in lower
            or (response.status_code == 403 and "location" in lower)
            or ("region" in lower and "not" in lower)
        )

        return {
            "ok": False,
            "reason": "blocked" if blocked else "error",
            "message": humanize_error(response.status_code, body),
        }

    def _resolve(
        self,
        requested_provider: str | None,
        requested_model: str | None,
    ) -> tuple[str, str, str]:
        available = self.available_providers()

        if requested_provider:
            if requested_provider not in PROVIDER_CATALOG:
                raise AiRequestError("Неизвестный провайдер")
            if requested_provider not in available:
                raise AiRequestError(
                    f"На сервере нет API-ключа для {requested_provider}"
                )
            provider = requested_provider
        else:
            provider = self.settings.ai_default_provider
            if provider not in available:
                provider = available[0]

        info = PROVIDER_CATALOG[provider]
        model = requested_model or info.default_model
        if not any(item.id == model for item in info.models):
            raise AiRequestError(f"Модель {model} недоступна для {provider}")

        return provider, model, self.settings.api_key_for(provider)

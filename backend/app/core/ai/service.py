import asyncio
from typing import AsyncIterator

import httpx

from app.core.ai.catalog import PROVIDER_CATALOG
from app.core.ai.errors import AiRequestError, humanize_error
from app.core.ai.markers import MarkerFilter
from app.core.ai.probe import probe_gemini
from app.core.ai.provider_clients import build_provider
from app.core.ai.prompts import (
    FIRST_USER_KICKOFF,
    RESUME_MODES,
    build_interview_system_prompt,
    build_resume_system_prompt,
)
from app.core.ai.providers import ProviderError
from app.core.ai.schemas import ChatRequest, PreparedChat
from app.core.config import Settings
from app.core.sse import sse


class AiChatService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient | None = None) -> None:
        self.settings = settings
        self.http = http

    def available_providers(self) -> list[str]:
        settings = self.settings
        return [p for p in PROVIDER_CATALOG if p == "mock" or settings.api_key_for(p)]

    def prepare(self, payload: ChatRequest) -> PreparedChat:
        modes = ("practice", "vacancy") if payload.task == "interview" else RESUME_MODES
        if payload.mode not in modes:
            raise AiRequestError(
                "Неизвестный режим интервью"
                if payload.task == "interview"
                else "Неизвестный режим резюме"
            )
        if payload.task == "resume" and not payload.messages:
            raise AiRequestError("Для анализа резюме нужен текст резюме")
        if len(payload.messages) > self.settings.ai_max_messages:
            raise AiRequestError("Слишком длинная история сообщений")
        if any(
            len(message.content) > self.settings.ai_max_message_chars
            for message in payload.messages
        ):
            raise AiRequestError("Сообщение слишком длинное")

        provider, model, api_key = self._resolve(payload.provider, payload.model)
        system = (
            build_interview_system_prompt(payload.mode, payload.vacancy)
            if payload.task == "interview"
            else build_resume_system_prompt(payload.mode)
        )
        messages = [message.model_dump() for message in payload.messages]
        if payload.task == "interview" and not messages:
            messages = [{"role": "user", "content": FIRST_USER_KICKOFF}]
        return PreparedChat(provider, model, api_key, system, messages)

    def models_payload(self) -> dict:
        available = self.available_providers()
        default = self.settings.ai_default_provider
        if default not in available:
            default = available[0]
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
                "provider": default,
                "model": PROVIDER_CATALOG[default].default_model,
            },
        }

    async def stream_events(self, prepared: PreparedChat) -> AsyncIterator[dict]:
        yield {"type": "thinking"}
        marker = MarkerFilter()
        provider = build_provider(prepared.provider, self.http, self.settings)

        try:
            async for event in provider.stream(
                system=prepared.system,
                messages=prepared.messages,
                model=prepared.model,
                api_key=prepared.api_key,
            ):
                if event.get("type") == "delta":
                    for item in marker.feed(str(event.get("text") or "")):
                        yield item
                elif event.get("type") == "error":
                    yield event
                    return
                else:
                    yield event

            for item in marker.flush():
                yield item
            yield {"type": "done"}
        except ProviderError as error:
            yield {"type": "error", "message": humanize_error(error.status, error.body)}
        except asyncio.CancelledError:
            raise
        except Exception as error:
            yield {"type": "error", "message": str(error) or "Ошибка запроса"}

    async def stream(self, prepared: PreparedChat) -> AsyncIterator[str]:
        async for event in self.stream_events(prepared):
            yield sse(event)

    async def probe(self, provider: str) -> dict:
        return await probe_gemini(self.settings, self.http, provider)

    def _resolve(
        self, requested_provider: str | None, requested_model: str | None
    ) -> tuple[str, str, str]:
        available = self.available_providers()
        if requested_provider and requested_provider not in PROVIDER_CATALOG:
            raise AiRequestError("Неизвестный провайдер")
        if requested_provider and requested_provider not in available:
            raise AiRequestError(f"На сервере нет API-ключа для {requested_provider}")

        provider = requested_provider or self.settings.ai_default_provider
        if provider not in available:
            provider = available[0]

        info = PROVIDER_CATALOG[provider]
        model = requested_model or info.default_model
        if not any(item.id == model for item in info.models):
            raise AiRequestError(f"Модель {model} недоступна для {provider}")
        return provider, model, self.settings.api_key_for(provider)

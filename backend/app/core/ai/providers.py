import json
from typing import AsyncIterator, Callable, Protocol

import httpx

from app.core.ai.parsing import sse_payload


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


def split_text(text: str, size: int = 18) -> list[str]:
    return [text[index : index + size] for index in range(0, len(text), size)]


def require_http(http: httpx.AsyncClient | None) -> httpx.AsyncClient:
    if http is None:
        raise ProviderError(500, "HTTP-клиент не инициализирован")
    return http


async def read_sse(
    http: httpx.AsyncClient,
    url: str,
    body: dict,
    parse: Callable[[dict], list[dict]],
    headers: dict[str, str] | None = None,
) -> AsyncIterator[dict]:
    async with http.stream("POST", url, json=body, headers=headers) as response:
        if response.status_code >= 400:
            text = (await response.aread()).decode("utf-8", "replace")
            raise ProviderError(response.status_code, text)

        async for line in response.aiter_lines():
            if data := sse_payload(line):
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue
                for item in payload if isinstance(payload, list) else [payload]:
                    if isinstance(item, dict):
                        for event in parse(item):
                            yield event

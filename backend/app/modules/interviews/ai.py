from typing import AsyncIterator

from app.core.ai.schemas import ChatMessage, ChatRequest
from app.core.ai.service import AiChatService
from app.core.ai.prompts import VacancyContext
from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMode,
)


NEXT_QUESTION_PROMPT = (
    "Задай следующий основной вопрос интервью. Не повторяй предыдущий."
)


def to_ai_messages(messages: list[InterviewMessage]) -> list[ChatMessage]:
    return [
        ChatMessage(role=message.role, content=message.content)
        for message in messages
    ]


class InterviewAi:
    def __init__(self, chat: AiChatService) -> None:
        self.chat = chat

    def resolve_selection(
        self, provider: str | None, model: str | None
    ) -> tuple[str, str]:
        return self.chat.resolve_provider_model(provider, model)

    async def stream(
        self,
        *,
        mode: InterviewMode,
        vacancy: VacancyContext | None,
        provider: str | None,
        model: str | None,
        messages: list[InterviewMessage],
        next_question: bool = False,
    ) -> AsyncIterator[dict]:
        chat_messages = to_ai_messages(messages)
        if next_question:
            chat_messages.append(
                ChatMessage(role="user", content=NEXT_QUESTION_PROMPT)
            )

        prepared = self.chat.prepare(
            ChatRequest(
                task="interview",
                mode=mode,
                vacancy=vacancy,
                messages=chat_messages,
                provider=provider,
                model=model,
            )
        )
        async for event in self.chat.stream_events(prepared):
            yield event

from typing import AsyncIterator

from app.core.ai.schemas import ChatMessage, ChatRequest
from app.core.ai.service import AiChatService
from app.modules.resumes.schemas import ResumeMessage, ResumeMode


RESUME_WRAPPER_START = "--- НАЧАЛО РЕЗЮМЕ ---"
RESUME_WRAPPER_END = "--- КОНЕЦ РЕЗЮМЕ ---"


def to_ai_messages(messages: list[ResumeMessage]) -> list[ChatMessage]:
    result: list[ChatMessage] = []
    first_user = True
    for message in messages:
        content = message.content
        if message.role == "user" and first_user:
            content = (
                "Проанализируй резюме ниже.\n\n"
                f"{RESUME_WRAPPER_START}\n{content}\n{RESUME_WRAPPER_END}"
            )
            first_user = False
        result.append(ChatMessage(role=message.role, content=content))
    return result


class ResumeAi:
    def __init__(self, chat: AiChatService) -> None:
        self.chat = chat

    async def stream(
        self,
        *,
        mode: ResumeMode,
        messages: list[ResumeMessage],
    ) -> AsyncIterator[dict]:
        prepared = self.chat.prepare(
            ChatRequest(
                task="resume",
                mode=mode,
                messages=to_ai_messages(messages),
            )
        )
        async for event in self.chat.stream_events(prepared):
            yield event

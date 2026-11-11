import asyncio
from dataclasses import dataclass, field
from typing import AsyncIterator

from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.repository import InMemoryResumeRepository
from app.modules.resumes.schemas import (
    ResumeCheck,
    ResumeMessage,
    ResumeMessageStatus,
    ResumeStatus,
)


@dataclass
class Turn:
    check: ResumeCheck
    progress: int
    content: list[str] = field(default_factory=list)
    thought: list[str] = field(default_factory=list)
    feedback: bool = False
    finished: bool = False

    @property
    def text(self) -> str:
        return "".join(self.content).strip()

    @property
    def reasoning(self) -> str:
        return "".join(self.thought).strip()

    def track(self, event: dict) -> str | None:
        kind = event.get("type")
        if kind == "delta":
            self.content.append(str(event.get("text") or ""))
        elif kind == "thought":
            self.thought.append(str(event.get("text") or ""))
        elif kind == "progress":
            self.progress = int(event.get("value") or 0)
        elif kind == "feedback":
            self.feedback = True
        return kind


class ResumeStreamer:
    def __init__(self, repository: InMemoryResumeRepository, ai: ResumeAi) -> None:
        self.repository = repository
        self.ai = ai

    async def stream_turn(self, check: ResumeCheck) -> AsyncIterator[dict]:
        messages = await self.repository.list_messages(check.id)
        turn = Turn(check, check.progress)

        try:
            async for event in self.ai.stream(mode=check.mode, messages=messages):
                kind = turn.track(event)

                if kind == "error":
                    await self._finish(turn, "error", "partial")
                    yield event
                    return

                if kind == "done":
                    if not turn.text:
                        await self._finish(turn, "error", "partial")
                        yield {"type": "error", "message": "Модель вернула пустой ответ"}
                        return

                    status: ResumeStatus = (
                        "awaiting_next" if turn.feedback else "checking"
                    )
                    assistant = await self._finish(turn, status, "complete")
                    yield {
                        "type": "done",
                        "check_id": str(check.id),
                        "assistant_message_id": str(assistant.id),
                        "status": status,
                    }
                    return

                yield event

            await self._finish(turn, "error", "partial")
            yield {"type": "error", "message": "Поток завершился без финального события"}
        except asyncio.CancelledError:
            try:
                await asyncio.shield(self._finish(turn, "error", "partial"))
            except asyncio.CancelledError:
                pass
            raise
        except Exception as error:
            await self._finish(turn, "error", "partial")
            yield {"type": "error", "message": str(error) or "Ошибка анализа резюме"}

    async def _finish(
        self, turn: Turn, status: ResumeStatus, message_status: ResumeMessageStatus
    ) -> ResumeMessage | None:
        if turn.finished:
            return None

        assistant = None
        if turn.text:
            assistant = await self.repository.add_message(
                check_id=turn.check.id,
                role="assistant",
                content=turn.text,
                thought=turn.reasoning,
                is_feedback=turn.feedback,
                status=message_status,
            )

        await self.repository.update_check(turn.check.id, status=status, progress=turn.progress)
        turn.finished = True
        return assistant

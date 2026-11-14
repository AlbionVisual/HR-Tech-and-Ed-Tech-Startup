import asyncio
from dataclasses import dataclass, field
from typing import AsyncIterator

from app.modules.interviews.ai import InterviewAi
from app.modules.interviews.repository import InMemoryInterviewRepository
from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMessageStatus,
    InterviewPhase,
    InterviewSession,
)


@dataclass
class Turn:
    session: InterviewSession
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


class InterviewStreamer:
    def __init__(self, repository: InMemoryInterviewRepository, ai: InterviewAi) -> None:
        self.repository = repository
        self.ai = ai

    async def stream_turn(
        self,
        session: InterviewSession,
        *,
        next_question: bool = False,
    ) -> AsyncIterator[dict]:
        messages = await self.repository.list_messages(session.id)
        turn = Turn(session, session.progress)

        try:
            async for event in self.ai.stream(
                mode=session.mode,
                vacancy=session.vacancy,
                provider=session.provider,
                model=session.model,
                messages=messages,
                next_question=next_question,
            ):
                kind = turn.track(event)

                if kind == "error":
                    await self._finish(turn, turn.session.phase, "partial")
                    yield event
                    return

                if kind == "done":
                    if not turn.text:
                        await self._finish(turn, turn.session.phase, "partial")
                        yield {"type": "error", "message": "Модель вернула пустой ответ"}
                        return

                    phase: InterviewPhase = (
                        "awaiting_next" if turn.feedback else "interviewing"
                    )
                    assistant = await self._finish(turn, phase, "complete")
                    yield {
                        "type": "done",
                        "interview_id": str(session.id),
                        "assistant_message_id": str(assistant.id) if assistant else None,
                        "phase": phase,
                        "progress": turn.progress,
                    }
                    return

                yield event

            await self._finish(turn, turn.session.phase, "partial")
            yield {"type": "error", "message": "Поток завершился без финального события"}
        except asyncio.CancelledError:
            try:
                await asyncio.shield(self._finish(turn, turn.session.phase, "partial"))
            except asyncio.CancelledError:
                pass
            raise
        except Exception as error:
            await self._finish(turn, turn.session.phase, "partial")
            yield {"type": "error", "message": str(error) or "Ошибка интервью"}

    async def _finish(
        self,
        turn: Turn,
        phase: InterviewPhase,
        message_status: InterviewMessageStatus,
    ) -> InterviewMessage | None:
        if turn.finished:
            return None

        assistant = None
        if turn.text:
            assistant = await self.repository.add_message(
                session_id=turn.session.id,
                role="assistant",
                content=turn.text,
                thought=turn.reasoning,
                is_feedback=turn.feedback,
                status=message_status,
            )

        await self.repository.update_session(
            turn.session.id,
            phase=phase,
            progress=turn.progress,
        )
        turn.finished = True
        return assistant
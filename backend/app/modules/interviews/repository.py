import asyncio
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from app.core.ai.prompts import VacancyContext
from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMessageStatus,
    InterviewMode,
    InterviewPhase,
    InterviewSession,
)


InterviewRole = Literal["user", "assistant"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryInterviewRepository:
    def __init__(self) -> None:
        self._sessions: dict[UUID, InterviewSession] = {}
        self._messages: dict[UUID, list[InterviewMessage]] = {}
        self._lock = asyncio.Lock()

    def _owned(self, user_id: UUID, session_id: UUID) -> InterviewSession | None:
        session = self._sessions.get(session_id)
        if session and session.user_id == user_id and session.deleted_at is None:
            return session
        return None

    def _update(
        self,
        session: InterviewSession,
        *,
        now: datetime | None = None,
        **fields,
    ) -> InterviewSession:
        updated = session.model_copy(update={**fields, "updated_at": now or _now()})
        self._sessions[session.id] = updated
        return updated

    async def create_session(
        self,
        *,
        user_id: UUID,
        mode: InterviewMode,
        title: str,
        vacancy: VacancyContext | None,
        provider: str | None,
        model: str | None,
    ) -> InterviewSession:
        now = _now()
        session = InterviewSession(
            id=uuid4(),
            user_id=user_id,
            mode=mode,
            title=title,
            vacancy=vacancy,
            phase="interviewing",
            progress=0,
            provider=provider,
            model=model,
            created_at=now,
            updated_at=now,
        )
        async with self._lock:
            self._sessions[session.id] = session
            self._messages[session.id] = []
        return session

    async def get_session(
        self, user_id: UUID, session_id: UUID
    ) -> InterviewSession | None:
        async with self._lock:
            return self._owned(user_id, session_id)

    async def list_sessions(self, user_id: UUID) -> list[InterviewSession]:
        async with self._lock:
            sessions = [
                session
                for session in self._sessions.values()
                if session.user_id == user_id and session.deleted_at is None
            ]
        return sorted(sessions, key=lambda item: item.updated_at, reverse=True)

    async def update_session(
        self,
        session_id: UUID,
        *,
        phase: InterviewPhase,
        progress: int | None = None,
    ) -> InterviewSession:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                raise KeyError(f"Interview session not found: {session_id}")
            progress = session.progress if progress is None else progress
            return self._update(session, phase=phase, progress=progress)

    async def soft_delete_session(self, user_id: UUID, session_id: UUID) -> bool:
        async with self._lock:
            session = self._owned(user_id, session_id)
            if session is None:
                return False
            now = _now()
            self._update(session, now=now, deleted_at=now)
            return True

    async def soft_delete_all(self, user_id: UUID) -> int:
        async with self._lock:
            now = _now()
            count = 0
            for session in self._sessions.values():
                if session.user_id != user_id or session.deleted_at is not None:
                    continue
                self._update(session, now=now, deleted_at=now)
                count += 1
            return count

    async def add_message(
        self,
        *,
        session_id: UUID,
        role: InterviewRole,
        content: str,
        thought: str = "",
        is_feedback: bool = False,
        status: InterviewMessageStatus = "complete",
    ) -> InterviewMessage:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                raise KeyError(f"Interview session not found: {session_id}")
            messages = self._messages.setdefault(session_id, [])
            now = _now()
            message = InterviewMessage(
                id=uuid4(),
                session_id=session_id,
                role=role,
                content=content,
                thought=thought,
                is_feedback=is_feedback,
                status=status,
                seq=len(messages) + 1,
                created_at=now,
            )
            messages.append(message)
            self._update(session, now=now)
            return message

    async def list_messages(self, session_id: UUID) -> list[InterviewMessage]:
        async with self._lock:
            return list(self._messages.get(session_id, []))

    async def count_messages(self, session_id: UUID) -> int:
        async with self._lock:
            return len(self._messages.get(session_id, []))

    def clear(self) -> None:
        self._sessions.clear()
        self._messages.clear()


interview_repository = InMemoryInterviewRepository()

import asyncio
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from app.modules.resumes.schemas import (
    ResumeCheck,
    ResumeMessage,
    ResumeMessageStatus,
    ResumeMode,
    ResumeSourceType,
    ResumeStatus,
)


ResumeRole = Literal["user", "assistant"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryResumeRepository:
    def __init__(self) -> None:
        self._checks: dict[UUID, ResumeCheck] = {}
        self._messages: dict[UUID, list[ResumeMessage]] = {}
        self._lock = asyncio.Lock()

    def _owned(self, user_id: UUID, check_id: UUID) -> ResumeCheck | None:
        check = self._checks.get(check_id)
        if check and check.user_id == user_id and check.deleted_at is None:
            return check
        return None

    def _update(
        self, check: ResumeCheck, *, now: datetime | None = None, **fields
    ) -> ResumeCheck:
        updated = check.model_copy(update={**fields, "updated_at": now or _now()})
        self._checks[check.id] = updated
        return updated

    async def create_check(
        self, *, user_id: UUID, mode: ResumeMode, title: str,
        source_type: ResumeSourceType, source_filename: str | None,
        source_text: str,
    ) -> ResumeCheck:
        now = _now()
        check = ResumeCheck(
            id=uuid4(),
            user_id=user_id,
            mode=mode,
            title=title,
            source_type=source_type,
            source_filename=source_filename,
            source_text=source_text,
            source_chars=len(source_text),
            status="checking",
            progress=0,
            created_at=now,
            updated_at=now,
        )
        async with self._lock:
            self._checks[check.id] = check
            self._messages[check.id] = []
        return check

    async def get_check(self, user_id: UUID, check_id: UUID) -> ResumeCheck | None:
        async with self._lock:
            return self._owned(user_id, check_id)

    async def list_checks(self, user_id: UUID) -> list[ResumeCheck]:
        async with self._lock:
            checks = [
                check
                for check in self._checks.values()
                if check.user_id == user_id and check.deleted_at is None
            ]
        return sorted(checks, key=lambda item: item.updated_at, reverse=True)

    async def update_check(
        self, check_id: UUID, *, status: ResumeStatus, progress: int | None = None
    ) -> ResumeCheck:
        async with self._lock:
            check = self._checks.get(check_id)
            if check is None:
                raise KeyError(f"Resume check not found: {check_id}")
            progress = check.progress if progress is None else progress
            return self._update(check, status=status, progress=progress)

    async def soft_delete_check(self, user_id: UUID, check_id: UUID) -> bool:
        async with self._lock:
            check = self._owned(user_id, check_id)
            if check is None:
                return False
            now = _now()
            self._update(check, now=now, deleted_at=now)
            return True

    async def add_message(
        self, *, check_id: UUID, role: ResumeRole, content: str,
        thought: str = "", is_feedback: bool = False,
        status: ResumeMessageStatus = "complete",
    ) -> ResumeMessage:
        async with self._lock:
            check = self._checks.get(check_id)
            if check is None:
                raise KeyError(f"Resume check not found: {check_id}")

            messages = self._messages.setdefault(check_id, [])
            now = _now()
            message = ResumeMessage(
                id=uuid4(),
                check_id=check_id,
                role=role,
                content=content,
                thought=thought,
                is_feedback=is_feedback,
                status=status,
                seq=len(messages) + 1,
                created_at=now,
            )
            messages.append(message)
            self._update(check, now=now)
            return message

    async def list_messages(self, check_id: UUID) -> list[ResumeMessage]:
        async with self._lock:
            return list(self._messages.get(check_id, []))

    async def count_messages(self, check_id: UUID) -> int:
        async with self._lock:
            return len(self._messages.get(check_id, []))

    def clear(self) -> None:
        self._checks.clear()
        self._messages.clear()


resume_repository = InMemoryResumeRepository()

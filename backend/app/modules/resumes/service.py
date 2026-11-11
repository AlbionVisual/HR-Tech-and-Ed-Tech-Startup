from typing import AsyncIterator, Literal, cast
from uuid import UUID

from starlette.concurrency import run_in_threadpool

from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.mappers import to_message_out, to_summary
from app.modules.resumes.parsers import extract_text
from app.modules.resumes.repository import InMemoryResumeRepository
from app.modules.resumes.schemas import (
    ResumeCheck,
    ResumeCheckCreate,
    ResumeCheckDetail,
    ResumeCheckSummary,
    ResumeExtractResponse,
    ResumeMessage,
    ResumeMessageCreate,
)
from app.modules.resumes.streaming import ResumeStreamer
from app.modules.resumes.validators import (
    ResumeValidationError,
    detect_source_type,
    limit_text,
    make_title,
    safe_filename,
    validate_file_size,
    validate_message_text,
    validate_resume_text,
)


class ResumeNotFoundError(Exception):
    pass


class ResumeService:
    def __init__(self, repository: InMemoryResumeRepository, ai: ResumeAi) -> None:
        self.repository = repository
        self.streamer = ResumeStreamer(repository, ai)

    async def extract(
        self, filename: str | None, content_type: str | None, data: bytes
    ) -> ResumeExtractResponse:
        validate_file_size(data)
        source_type = detect_source_type(filename, content_type, data)
        text = await run_in_threadpool(extract_text, source_type, data)
        limited, truncated = limit_text(text)
        if not limited:
            raise ResumeValidationError("empty_text", "В файле не найден текст.")
        return ResumeExtractResponse(
            filename=safe_filename(filename),
            source_type=cast("Literal['pdf', 'docx']", source_type),
            text=limited,
            chars=len(limited),
            truncated=truncated,
        )

    async def create_check(
        self, user_id: UUID, payload: ResumeCheckCreate
    ) -> tuple[ResumeCheck, ResumeMessage]:
        text = validate_resume_text(payload.text)
        source_filename = (
            safe_filename(payload.source_filename)
            if payload.source_filename
            else None
        )
        check = await self.repository.create_check(
            user_id=user_id,
            mode=payload.mode,
            title=make_title(payload.mode, source_filename),
            source_type=payload.source_type,
            source_filename=source_filename,
            source_text=text,
        )
        message = await self.repository.add_message(
            check_id=check.id, role="user", content=text
        )
        return check, message

    async def begin_follow_up(
        self, user_id: UUID, check_id: UUID, payload: ResumeMessageCreate
    ) -> tuple[ResumeCheck, ResumeMessage]:
        check = await self.repository.get_check(user_id, check_id)
        if check is None:
            raise ResumeNotFoundError("Проверка резюме не найдена.")
        message = await self.repository.add_message(
            check_id=check.id,
            role="user",
            content=validate_message_text(payload.content),
        )
        check = await self.repository.update_check(check.id, status="checking")
        return check, message

    async def stream_turn(self, check: ResumeCheck) -> AsyncIterator[dict]:
        async for event in self.streamer.stream_turn(check):
            yield event

    async def list_checks(self, user_id: UUID) -> list[ResumeCheckSummary]:
        checks = await self.repository.list_checks(user_id)
        result: list[ResumeCheckSummary] = []
        for check in checks:
            count = await self.repository.count_messages(check.id)
            result.append(to_summary(check, count))
        return result

    async def get_check(self, user_id: UUID, check_id: UUID) -> ResumeCheckDetail:
        check = await self.repository.get_check(user_id, check_id)
        if check is None:
            raise ResumeNotFoundError("Проверка резюме не найдена.")
        messages = await self.repository.list_messages(check.id)
        summary = to_summary(check, len(messages))
        return ResumeCheckDetail(
            **summary.model_dump(),
            source_text=check.source_text,
            source_chars=check.source_chars,
            messages=[to_message_out(message) for message in messages],
        )

    async def delete_check(self, user_id: UUID, check_id: UUID) -> None:
        if not await self.repository.soft_delete_check(user_id, check_id):
            raise ResumeNotFoundError("Проверка резюме не найдена.")

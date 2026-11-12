from typing import AsyncIterator
from uuid import UUID

from app.modules.interviews.ai import InterviewAi
from app.modules.interviews.mappers import to_message_out, to_summary
from app.modules.interviews.repository import InMemoryInterviewRepository
from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMessageCreate,
    InterviewSession,
    InterviewSessionCreate,
    InterviewSessionDetail,
    InterviewSessionSummary,
)
from app.modules.interviews.streaming import InterviewStreamer


MAX_INTERVIEW_MESSAGE_CHARS = 20_000


class InterviewNotFoundError(Exception):
    pass


class InterviewValidationError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _title(mode: str, vacancy) -> str:
    if mode == "practice":
        return "Тренировка"
    company = (vacancy.company if vacancy else "").strip()
    return f"Вакансия: {company}"[:120] if company else "Вакансия"


class InterviewService:
    def __init__(
        self,
        repository: InMemoryInterviewRepository,
        ai: InterviewAi,
    ) -> None:
        self.repository = repository
        self.streamer = InterviewStreamer(repository, ai)
        self.ai = ai

    async def create_session(
        self,
        user_id: UUID,
        payload: InterviewSessionCreate,
    ) -> InterviewSession:
        if payload.mode == "vacancy":
            if not payload.vacancy:
                raise InterviewValidationError(
                    "vacancy_required", "Для режима вакансии нужен контекст вакансии."
                )
            if not payload.vacancy.company.strip():
                raise InterviewValidationError(
                    "vacancy_company_required", "Укажите компанию."
                )
            if not payload.vacancy.description.strip():
                raise InterviewValidationError(
                    "vacancy_description_required", "Укажите описание вакансии."
                )

        provider, model = self.ai.resolve_selection(payload.provider, payload.model)
        return await self.repository.create_session(
            user_id=user_id,
            mode=payload.mode,
            title=_title(payload.mode, payload.vacancy),
            vacancy=payload.vacancy,
            provider=provider,
            model=model,
        )

    async def begin_follow_up(
        self,
        user_id: UUID,
        session_id: UUID,
        payload: InterviewMessageCreate,
    ) -> tuple[InterviewSession, InterviewMessage]:
        session = await self.repository.get_session(user_id, session_id)
        if session is None:
            raise InterviewNotFoundError("Интервью не найдено.")

        content = self._validate_message(payload.content)
        message = await self.repository.add_message(
            session_id=session.id,
            role="user",
            content=content,
        )
        session = await self.repository.update_session(
            session.id,
            phase="interviewing",
        )
        return session, message

    async def begin_next_question(
        self,
        user_id: UUID,
        session_id: UUID,
    ) -> InterviewSession:
        session = await self.repository.get_session(user_id, session_id)
        if session is None:
            raise InterviewNotFoundError("Интервью не найдено.")
        if session.phase != "awaiting_next":
            raise InterviewValidationError(
                "invalid_state",
                "Следующий вопрос доступен только после feedback.",
                status_code=409,
            )
        return session

    async def stream_turn(
        self,
        session: InterviewSession,
        *,
        next_question: bool = False,
    ) -> AsyncIterator[dict]:
        async for event in self.streamer.stream_turn(
            session,
            next_question=next_question,
        ):
            yield event

    async def list_sessions(self, user_id: UUID) -> list[InterviewSessionSummary]:
        sessions = await self.repository.list_sessions(user_id)
        result: list[InterviewSessionSummary] = []
        for session in sessions:
            messages = await self.repository.list_messages(session.id)
            last_message = messages[-1].content if messages else None
            result.append(
                to_summary(
                    session,
                    messages_count=len(messages),
                    last_message=last_message,
                )
            )
        return result

    async def get_session(
        self,
        user_id: UUID,
        session_id: UUID,
    ) -> InterviewSessionDetail:
        session = await self.repository.get_session(user_id, session_id)
        if session is None:
            raise InterviewNotFoundError("Интервью не найдено.")

        messages = await self.repository.list_messages(session.id)
        summary = to_summary(
            session,
            messages_count=len(messages),
            last_message=messages[-1].content if messages else None,
        )
        return InterviewSessionDetail(
            **summary.model_dump(),
            vacancy=session.vacancy,
            messages=[to_message_out(message) for message in messages],
        )

    async def delete_session(self, user_id: UUID, session_id: UUID) -> None:
        if not await self.repository.soft_delete_session(user_id, session_id):
            raise InterviewNotFoundError("Интервью не найдено.")

    async def clear_sessions(self, user_id: UUID) -> None:
        await self.repository.soft_delete_all(user_id)

    @staticmethod
    def _validate_message(content: str) -> str:
        value = content.strip()
        if not value:
            raise InterviewValidationError("empty_message", "Сообщение пустое.")
        if len(value) > MAX_INTERVIEW_MESSAGE_CHARS:
            raise InterviewValidationError(
                "message_too_long",
                f"Сообщение слишком длинное: максимум {MAX_INTERVIEW_MESSAGE_CHARS} символов.",
            )
        return value

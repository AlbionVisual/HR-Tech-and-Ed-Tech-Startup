from uuid import UUID

from fastapi import Depends, HTTPException, Request

from app.core.ai.service import AiChatService
from app.core.config import settings
from app.core.db.connection import database
from app.core.limits import RateLimitExceeded
from app.modules.auth.deps import get_current_user_id
from app.modules.interviews.ai import InterviewAi
from app.modules.interviews.repository_sql import SqlInterviewRepository
from app.modules.interviews.service import InterviewService
from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.repository_sql import SqlResumeRepository
from app.modules.resumes.service import ResumeService
from app.modules.tests.service import TestService


def get_ai_service(request: Request) -> AiChatService:
    return AiChatService(settings, getattr(request.app.state, "http", None))


async def ai_rate_limit(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    limiter = getattr(request.app.state, "ai_rate_limiter", None)
    if limiter is None:
        return
    try:
        await limiter.hit(f"ai:{user_id}")
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "rate_limited",
                "message": (
                    "Слишком много AI-запросов. "
                    f"Повторите через {exc.retry_after} с."
                ),
            },
            headers={"Retry-After": str(exc.retry_after)},
        ) from exc


def get_interview_service(
    chat: AiChatService = Depends(get_ai_service),
) -> InterviewService:
    return InterviewService(SqlInterviewRepository(database), InterviewAi(chat))


def get_resume_service(
    request: Request,
    chat: AiChatService = Depends(get_ai_service),
) -> ResumeService:
    return ResumeService(
        SqlResumeRepository(database),
        ResumeAi(chat),
        parse_semaphore=getattr(request.app.state, "resume_parse_semaphore", None),
    )


def get_test_service() -> TestService:
    return TestService(database)

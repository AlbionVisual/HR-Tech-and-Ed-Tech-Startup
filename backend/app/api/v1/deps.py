from fastapi import Depends, Request

from app.core.ai.service import AiChatService
from app.core.config import settings
from app.core.db.connection import database
from app.core.db.service import DbService
from app.modules.interviews.ai import InterviewAi
from app.modules.interviews.repository_sql import SqlInterviewRepository
from app.modules.interviews.service import InterviewService
from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.repository_sql import SqlResumeRepository
from app.modules.resumes.service import ResumeService


def get_ai_service(request: Request) -> AiChatService:
    return AiChatService(settings, getattr(request.app.state, "http", None))

def get_db_service() -> DbService:
    return DbService(database)


def get_interview_service(
    chat: AiChatService = Depends(get_ai_service),
) -> InterviewService:
    return InterviewService(SqlInterviewRepository(database), InterviewAi(chat))


def get_resume_service(
    chat: AiChatService = Depends(get_ai_service),
) -> ResumeService:
    return ResumeService(SqlResumeRepository(database), ResumeAi(chat))
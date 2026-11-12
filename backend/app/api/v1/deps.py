from fastapi import Depends, Request

from app.core.ai.service import AiChatService
from app.core.config import settings
from app.modules.interviews.ai import InterviewAi
from app.modules.interviews.repository import interview_repository
from app.modules.interviews.service import InterviewService
from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.repository import resume_repository
from app.modules.resumes.service import ResumeService


def get_ai_service(request: Request) -> AiChatService:
    return AiChatService(settings, getattr(request.app.state, "http", None))


def get_resume_service(chat: AiChatService = Depends(get_ai_service)) -> ResumeService:
    return ResumeService(resume_repository, ResumeAi(chat))


def get_interview_service(
    chat: AiChatService = Depends(get_ai_service),
) -> InterviewService:
    return InterviewService(interview_repository, InterviewAi(chat))

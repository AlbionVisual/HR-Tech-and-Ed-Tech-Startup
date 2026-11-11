from fastapi import Depends, Request

from app.core.ai.service import AiChatService
from app.core.config import settings
from app.modules.resumes.ai import ResumeAi
from app.modules.resumes.repository import resume_repository
from app.modules.resumes.service import ResumeService


def get_ai_service(request: Request) -> AiChatService:
    return AiChatService(settings, getattr(request.app.state, "http", None))


def get_resume_service(chat: AiChatService = Depends(get_ai_service)) -> ResumeService:
    return ResumeService(resume_repository, ResumeAi(chat))

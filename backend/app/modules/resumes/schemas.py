from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.core.ai.prompts import RESUME_MODES


ResumeMode = Literal["ats_check", "improve_experience", "keywords", "formatting"]
ResumeSourceType = Literal["text", "pdf", "docx"]
ResumeStatus = Literal["checking", "awaiting_next", "completed", "error"]
ResumeMessageStatus = Literal["complete", "partial", "error"]

MODE_LABELS: dict[ResumeMode, str] = {
    "ats_check": "Проверка ATS",
    "improve_experience": "Улучшить опыт",
    "keywords": "Ключевые слова",
    "formatting": "Форматирование",
}


class ResumeCheckCreate(BaseModel):
    mode: ResumeMode
    text: str
    source_type: ResumeSourceType = "text"
    source_filename: str | None = None


class ResumeMessageCreate(BaseModel):
    content: str


class ResumeExtractResponse(BaseModel):
    filename: str
    source_type: Literal["pdf", "docx"]
    text: str
    chars: int
    truncated: bool


class ResumeMessageOut(BaseModel):
    id: UUID
    role: Literal["user", "assistant"]
    content: str
    thought: str
    is_feedback: bool
    status: ResumeMessageStatus
    seq: int
    created_at: datetime


class ResumeMessage(ResumeMessageOut):
    check_id: UUID


class ResumeCheckBase(BaseModel):
    id: UUID
    mode: ResumeMode
    title: str
    status: ResumeStatus
    progress: int
    source_type: ResumeSourceType
    source_filename: str | None
    created_at: datetime
    updated_at: datetime


class ResumeCheckSummary(ResumeCheckBase):
    messages_count: int


class ResumeCheckDetail(ResumeCheckSummary):
    source_text: str
    source_chars: int
    messages: list[ResumeMessageOut]


class ResumeCheck(ResumeCheckBase):
    user_id: UUID
    source_text: str
    source_chars: int
    deleted_at: datetime | None = None

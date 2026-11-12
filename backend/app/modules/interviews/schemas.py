from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.core.ai.prompts import VacancyContext


InterviewMode = Literal["practice", "vacancy"]
InterviewPhase = Literal["interviewing", "awaiting_next"]
InterviewMessageStatus = Literal["complete", "partial", "error"]

INTERVIEW_MODES: tuple[InterviewMode, ...] = ("practice", "vacancy")


class InterviewSessionCreate(BaseModel):
    mode: InterviewMode
    vacancy: VacancyContext | None = None
    provider: str | None = None
    model: str | None = None


class InterviewMessageCreate(BaseModel):
    content: str


class InterviewMessageOut(BaseModel):
    id: UUID
    role: Literal["user", "assistant"]
    content: str
    thought: str
    is_feedback: bool
    status: InterviewMessageStatus
    seq: int
    created_at: datetime


class InterviewMessage(InterviewMessageOut):
    session_id: UUID


class InterviewSessionBase(BaseModel):
    id: UUID
    mode: InterviewMode
    title: str
    phase: InterviewPhase
    progress: int
    provider: str | None
    model: str | None
    created_at: datetime
    updated_at: datetime


class InterviewSessionSummary(InterviewSessionBase):
    last_message: str | None = None
    messages_count: int = 0


class InterviewSessionDetail(InterviewSessionSummary):
    vacancy: VacancyContext | None
    messages: list[InterviewMessageOut]


class InterviewSession(InterviewSessionBase):
    user_id: UUID
    vacancy: VacancyContext | None
    deleted_at: datetime | None = None

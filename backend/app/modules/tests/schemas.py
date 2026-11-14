from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class TestLanguageOut(BaseModel):
    slug: str
    title: str
    icon: str
    tests_count: int


class TestStatsOut(BaseModel):
    completed_count: int


class TestQuestionOut(BaseModel):
    id: UUID
    question: str
    options: list[str]


class TestAttemptCreate(BaseModel):
    language: str


class TestAttemptOut(BaseModel):
    attempt_id: UUID
    language: str
    language_title: str
    total: int
    lives: int
    questions: list[TestQuestionOut]


class TestAnswerCreate(BaseModel):
    question_id: UUID
    selected_index: int


class TestAnswerOut(BaseModel):
    question_id: UUID
    selected_index: int
    correct_index: int
    correct_option: str
    is_correct: bool
    lives: int
    answered_count: int
    correct_count: int
    finished: bool


class TestWrongQuestion(BaseModel):
    question: str
    options: list[str]
    selected_index: int
    correct_index: int
    correct_option: str


class TestResultOut(BaseModel):
    attempt_id: UUID
    language: str
    language_title: str
    correct_count: int
    total: int
    lives: int
    wrong_questions: list[TestWrongQuestion]


class TestAttemptSummary(BaseModel):
    id: UUID
    language: str
    language_title: str
    correct_count: int
    total: int
    lives: int
    status: Literal["in_progress", "finished"]
    created_at: datetime
    finished_at: datetime | None

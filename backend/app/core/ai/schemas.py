from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from app.core.ai.prompts import VacancyContext


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    task: Literal["interview", "resume"]
    mode: str
    vacancy: VacancyContext | None = None
    messages: list[ChatMessage] = Field(default_factory=list)
    provider: str | None = None
    model: str | None = None


@dataclass
class PreparedChat:
    provider: str
    model: str
    api_key: str
    system: str
    messages: list[dict[str, str]]

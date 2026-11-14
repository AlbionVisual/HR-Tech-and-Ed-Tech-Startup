"""normalize interview and resume storage

Revision ID: 0001_normalized_schema
Revises:
Create Date: 2026-11-14

"""
import json
from datetime import datetime, timezone
from typing import Sequence, Union
from uuid import UUID

import sqlalchemy as sa
from alembic import op

from app.core.db.models import (
    Base,
    InterviewMessage,
    InterviewSession,
    ResumeCheck,
    ResumeMessage,
)


revision: str = "0001_normalized_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _to_dt(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        value = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def _as_dict(value) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _as_uuid(value) -> UUID:
    if isinstance(value, UUID):
        return value
    text = str(value)
    try:
        return UUID(text)
    except ValueError:
        return UUID(hex=text)


def _legacy_table(bind, name: str):
    inspector = sa.inspect(bind)
    if not inspector.has_table(name):
        return None
    return sa.Table(name, sa.MetaData(), autoload_with=bind)


def _migrate_interviews(bind) -> None:
    old = _legacy_table(bind, "interview_tests")
    if old is None:
        return

    rows = bind.execute(sa.select(old)).mappings().all()
    for row in rows:
        payload = _as_dict(row.get("payload"))
        session_id = _as_uuid(row["id"])
        created_at = _to_dt(payload.get("created_at")) or row.get("created_at")
        updated_at = _to_dt(payload.get("updated_at")) or created_at
        bind.execute(
            sa.insert(InterviewSession).values(
                id=session_id,
                user_id=_as_uuid(row["user_id"]),
                mode=row["mode"],
                title=row["title"],
                vacancy=payload.get("vacancy"),
                phase=payload.get("phase", "interviewing"),
                progress=int(payload.get("progress", 0) or 0),
                provider=payload.get("provider"),
                model=payload.get("model"),
                created_at=created_at or datetime.now(timezone.utc),
                updated_at=updated_at or datetime.now(timezone.utc),
                deleted_at=_to_dt(payload.get("deleted_at")),
            )
        )
        for message in payload.get("messages", []) or []:
            bind.execute(
                sa.insert(InterviewMessage).values(
                    id=_as_uuid(message["id"]),
                    session_id=session_id,
                    role=message["role"],
                    content=message["content"],
                    thought=message.get("thought", ""),
                    is_feedback=bool(message.get("is_feedback", False)),
                    status=message.get("status", "complete"),
                    seq=int(message.get("seq", 1)),
                    created_at=_to_dt(message.get("created_at"))
                    or datetime.now(timezone.utc),
                )
            )


def _migrate_resumes(bind) -> None:
    old = _legacy_table(bind, "resume_tests")
    if old is None:
        return

    rows = bind.execute(sa.select(old)).mappings().all()
    for row in rows:
        result = _as_dict(row.get("result"))
        source_text = result.get("source_text") or row.get("text") or ""
        created_at = _to_dt(result.get("created_at")) or row.get("created_at")
        updated_at = _to_dt(result.get("updated_at")) or created_at
        bind.execute(
            sa.insert(ResumeCheck).values(
                id=_as_uuid(row["id"]),
                user_id=_as_uuid(row["user_id"]),
                mode=row["mode"],
                title=result.get("title", "Проверка резюме"),
                source_type=result.get("source_type", "text"),
                source_filename=result.get("source_filename"),
                source_text=source_text,
                source_chars=int(result.get("source_chars", len(source_text)) or 0),
                status=result.get("status", "checking"),
                progress=int(result.get("progress", 0) or 0),
                created_at=created_at or datetime.now(timezone.utc),
                updated_at=updated_at or datetime.now(timezone.utc),
                deleted_at=_to_dt(result.get("deleted_at")),
            )
        )
        for message in result.get("messages", []) or []:
            bind.execute(
                sa.insert(ResumeMessage).values(
                    id=_as_uuid(message["id"]),
                    check_id=_as_uuid(row["id"]),
                    role=message["role"],
                    content=message["content"],
                    thought=message.get("thought", ""),
                    is_feedback=bool(message.get("is_feedback", False)),
                    status=message.get("status", "complete"),
                    seq=int(message.get("seq", 1)),
                    created_at=_to_dt(message.get("created_at"))
                    or datetime.now(timezone.utc),
                )
            )


def upgrade() -> None:
    bind = op.get_bind()
    had_interviews = sa.inspect(bind).has_table("interview_tests")
    had_resumes = sa.inspect(bind).has_table("resume_tests")

    Base.metadata.create_all(bind=bind)

    if had_interviews:
        _migrate_interviews(bind)
        op.drop_table("interview_tests")
    if had_resumes:
        _migrate_resumes(bind)
        op.drop_table("resume_tests")


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())

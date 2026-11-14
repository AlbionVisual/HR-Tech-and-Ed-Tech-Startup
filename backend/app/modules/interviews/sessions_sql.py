from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select

from app.core.ai.prompts import VacancyContext
from app.core.db.connection import Database
from app.core.db.models import InterviewSession as InterviewSessionRow
from app.modules.interviews.schemas import InterviewSession


class SessionsSql:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def create_session(
        self,
        *,
        user_id: UUID,
        mode: str,
        title: str,
        vacancy: VacancyContext | None,
        provider: str | None,
        model: str | None,
    ) -> InterviewSession:
        async with self._db.session() as session:
            row = InterviewSessionRow(
                id=uuid4(),
                user_id=user_id,
                mode=mode,
                title=title,
                vacancy=vacancy.model_dump() if vacancy else None,
                phase="interviewing",
                progress=0,
                provider=provider,
                model=model,
            )
            session.add(row)
            await session.flush()
            return self._to_schema(row)

    async def get_session(
        self, user_id: UUID, session_id: UUID
    ) -> InterviewSession | None:
        async with self._db.session() as session:
            row = await session.scalar(
                select(InterviewSessionRow).where(
                    InterviewSessionRow.id == session_id,
                    InterviewSessionRow.user_id == user_id,
                    InterviewSessionRow.deleted_at.is_(None),
                )
            )
            return self._to_schema(row) if row else None

    async def list_sessions(self, user_id: UUID) -> list[InterviewSession]:
        async with self._db.session() as session:
            rows = (
                await session.scalars(
                    select(InterviewSessionRow)
                    .where(
                        InterviewSessionRow.user_id == user_id,
                        InterviewSessionRow.deleted_at.is_(None),
                    )
                    .order_by(InterviewSessionRow.updated_at.desc())
                )
            ).all()
            return [self._to_schema(row) for row in rows]

    async def update_session(
        self,
        session_id: UUID,
        *,
        phase: str,
        progress: int | None = None,
    ) -> InterviewSession:
        async with self._db.session() as session:
            row = await session.get(InterviewSessionRow, session_id)
            if row is None:
                raise KeyError(f"Interview session not found: {session_id}")
            row.phase = phase
            if progress is not None:
                row.progress = progress
            row.updated_at = datetime.now(timezone.utc)
            await session.flush()
            return self._to_schema(row)

    async def soft_delete_session(self, user_id: UUID, session_id: UUID) -> bool:
        async with self._db.session() as session:
            row = await session.scalar(
                select(InterviewSessionRow).where(
                    InterviewSessionRow.id == session_id,
                    InterviewSessionRow.user_id == user_id,
                    InterviewSessionRow.deleted_at.is_(None),
                )
            )
            if row is None:
                return False
            now = datetime.now(timezone.utc)
            row.deleted_at = now
            row.updated_at = now
            return True

    async def soft_delete_all(self, user_id: UUID) -> int:
        async with self._db.session() as session:
            rows = (
                await session.scalars(
                    select(InterviewSessionRow).where(
                        InterviewSessionRow.user_id == user_id,
                        InterviewSessionRow.deleted_at.is_(None),
                    )
                )
            ).all()
            now = datetime.now(timezone.utc)
            for row in rows:
                row.deleted_at = now
                row.updated_at = now
            return len(rows)

    @staticmethod
    def _to_schema(row: InterviewSessionRow) -> InterviewSession:
        return InterviewSession(
            id=row.id,
            user_id=row.user_id,
            mode=row.mode,
            title=row.title,
            phase=row.phase,
            progress=row.progress,
            provider=row.provider,
            model=row.model,
            vacancy=VacancyContext(**row.vacancy) if row.vacancy else None,
            created_at=row.created_at,
            updated_at=row.updated_at,
            deleted_at=row.deleted_at,
        )

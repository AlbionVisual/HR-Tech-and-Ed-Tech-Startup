from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select

from app.core.db.connection import Database
from app.core.db.models import ResumeCheck as ResumeCheckRow
from app.core.db.models import ResumeMessage as ResumeMessageRow
from app.modules.resumes.schemas import ResumeCheck, ResumeMessage


class ChecksSql:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def create_check(
        self,
        *,
        user_id: UUID,
        mode: str,
        title: str,
        source_type: str,
        source_filename: str | None = None,
        source_text: str,
    ) -> ResumeCheck:
        async with self._db.session() as session:
            row = ResumeCheckRow(
                id=uuid4(),
                user_id=user_id,
                mode=mode,
                title=title,
                source_type=source_type,
                source_filename=source_filename,
                source_text=source_text,
                source_chars=len(source_text),
                status="checking",
                progress=0,
            )
            session.add(row)
            await session.flush()
            return self._to_schema(row)

    async def get_check(self, user_id: UUID, check_id: UUID) -> ResumeCheck | None:
        async with self._db.session() as session:
            row = await session.scalar(
                select(ResumeCheckRow).where(
                    ResumeCheckRow.id == check_id,
                    ResumeCheckRow.user_id == user_id,
                    ResumeCheckRow.deleted_at.is_(None),
                )
            )
            return self._to_schema(row) if row else None

    async def list_checks(self, user_id: UUID) -> list[ResumeCheck]:
        async with self._db.session() as session:
            rows = (
                await session.scalars(
                    select(ResumeCheckRow)
                    .where(
                        ResumeCheckRow.user_id == user_id,
                        ResumeCheckRow.deleted_at.is_(None),
                    )
                    .order_by(ResumeCheckRow.updated_at.desc())
                )
            ).all()
            return [self._to_schema(row) for row in rows]

    async def update_check(
        self,
        check_id: UUID,
        *,
        status: str,
        progress: int | None = None,
    ) -> ResumeCheck:
        async with self._db.session() as session:
            row = await session.get(ResumeCheckRow, check_id)
            if row is None:
                raise KeyError(f"Resume check not found: {check_id}")
            row.status = status
            if progress is not None:
                row.progress = progress
            row.updated_at = datetime.now(timezone.utc)
            await session.flush()
            return self._to_schema(row)

    async def soft_delete_check(self, user_id: UUID, check_id: UUID) -> bool:
        async with self._db.session() as session:
            row = await session.scalar(
                select(ResumeCheckRow).where(
                    ResumeCheckRow.id == check_id,
                    ResumeCheckRow.user_id == user_id,
                    ResumeCheckRow.deleted_at.is_(None),
                )
            )
            if row is None:
                return False
            now = datetime.now(timezone.utc)
            row.deleted_at = now
            row.updated_at = now
            return True

    async def add_message(
        self,
        *,
        check_id: UUID,
        role: str,
        content: str,
        thought: str = "",
        is_feedback: bool = False,
        status: str = "complete",
    ) -> ResumeMessage:
        async with self._db.session() as session:
            parent = await session.get(ResumeCheckRow, check_id)
            if parent is None:
                raise KeyError(f"Resume check not found: {check_id}")
            max_seq = await session.scalar(
                select(func.max(ResumeMessageRow.seq)).where(
                    ResumeMessageRow.check_id == check_id
                )
            )
            row = ResumeMessageRow(
                id=uuid4(),
                check_id=check_id,
                role=role,
                content=content,
                thought=thought,
                is_feedback=is_feedback,
                status=status,
                seq=int(max_seq or 0) + 1,
            )
            session.add(row)
            parent.updated_at = datetime.now(timezone.utc)
            await session.flush()
            return self._to_message(row)

    async def list_messages(self, check_id: UUID) -> list[ResumeMessage]:
        async with self._db.session() as session:
            rows = (
                await session.scalars(
                    select(ResumeMessageRow)
                    .where(ResumeMessageRow.check_id == check_id)
                    .order_by(ResumeMessageRow.seq)
                )
            ).all()
            return [self._to_message(row) for row in rows]

    async def count_messages(self, check_id: UUID) -> int:
        async with self._db.session() as session:
            count = await session.scalar(
                select(func.count())
                .select_from(ResumeMessageRow)
                .where(ResumeMessageRow.check_id == check_id)
            )
            return int(count or 0)

    @staticmethod
    def _to_schema(row: ResumeCheckRow) -> ResumeCheck:
        return ResumeCheck(
            id=row.id,
            user_id=row.user_id,
            mode=row.mode,
            title=row.title,
            status=row.status,
            progress=row.progress,
            source_type=row.source_type,
            source_filename=row.source_filename,
            source_text=row.source_text,
            source_chars=row.source_chars,
            created_at=row.created_at,
            updated_at=row.updated_at,
            deleted_at=row.deleted_at,
        )

    @staticmethod
    def _to_message(row: ResumeMessageRow) -> ResumeMessage:
        return ResumeMessage(
            id=row.id,
            check_id=row.check_id,
            role=row.role,
            content=row.content,
            thought=row.thought,
            is_feedback=row.is_feedback,
            status=row.status,
            seq=row.seq,
            created_at=row.created_at,
        )

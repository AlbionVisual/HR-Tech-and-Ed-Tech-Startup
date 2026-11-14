from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select

from app.core.db.connection import Database
from app.core.db.models import InterviewMessage as InterviewMessageRow
from app.core.db.models import InterviewSession as InterviewSessionRow
from app.modules.interviews.schemas import InterviewMessage, InterviewMessageStatus


class MessagesSql:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def list_messages(self, session_id: UUID) -> list[InterviewMessage]:
        async with self._db.session() as session:
            rows = (
                await session.scalars(
                    select(InterviewMessageRow)
                    .where(InterviewMessageRow.session_id == session_id)
                    .order_by(InterviewMessageRow.seq)
                )
            ).all()
            return [self._to_schema(row) for row in rows]

    async def add_message(
        self,
        *,
        session_id: UUID,
        role: str,
        content: str,
        thought: str = "",
        is_feedback: bool = False,
        status: InterviewMessageStatus = "complete",
    ) -> InterviewMessage:
        async with self._db.session() as session:
            parent = await session.get(InterviewSessionRow, session_id)
            if parent is None:
                raise KeyError(f"Interview session not found: {session_id}")

            max_seq = await session.scalar(
                select(func.max(InterviewMessageRow.seq)).where(
                    InterviewMessageRow.session_id == session_id
                )
            )
            row = InterviewMessageRow(
                id=uuid4(),
                session_id=session_id,
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
            return self._to_schema(row)

    async def count_messages(self, session_id: UUID) -> int:
        async with self._db.session() as session:
            count = await session.scalar(
                select(func.count())
                .select_from(InterviewMessageRow)
                .where(InterviewMessageRow.session_id == session_id)
            )
            return int(count or 0)

    @staticmethod
    def _to_schema(row: InterviewMessageRow) -> InterviewMessage:
        return InterviewMessage(
            id=row.id,
            session_id=row.session_id,
            role=row.role,
            content=row.content,
            thought=row.thought,
            is_feedback=row.is_feedback,
            status=row.status,
            seq=row.seq,
            created_at=row.created_at,
        )

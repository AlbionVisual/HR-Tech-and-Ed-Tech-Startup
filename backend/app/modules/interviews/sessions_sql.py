from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select

from app.core.ai.prompts import VacancyContext
from app.core.db.connection import Database
from app.core.db.models import InterviewTest
from app.modules.interviews.schemas import InterviewSession
from sqlalchemy.orm.attributes import flag_modified


class SessionsSql:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def create_session(
        self, *, user_id: UUID, mode: str, title: str, vacancy: VacancyContext | None,
        provider: str | None, model: str | None,
    ) -> InterviewSession:
        now = datetime.now(timezone.utc)
        payload = {
            "vacancy": vacancy.model_dump() if vacancy else None,
            "provider": provider,
            "model": model,
            "phase": "interviewing",
            "progress": 0,
            "messages": [],
            "deleted_at": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        async with self._db.session() as session:
            row = InterviewTest(
                id=uuid4(), user_id=user_id, mode=mode, title=title, payload=payload
            )
            session.add(row)
            await session.flush()
            return self._to_schema(row)

    async def get_session(self, user_id: UUID, session_id: UUID) -> InterviewSession | None:
        async with self._db.session() as session:
            row = await session.get(InterviewTest, session_id)
            if row is None or row.user_id != user_id or row.payload.get("deleted_at"):
                return None
            return self._to_schema(row)

    async def list_sessions(self, user_id: UUID) -> list[InterviewSession]:
        async with self._db.session() as session:
            rows = await session.scalars(
                select(InterviewTest).where(
                    InterviewTest.user_id == user_id,
                    InterviewTest.payload["deleted_at"].astext == None
                )
            )

            return [self._to_schema(r) for r in rows if not r.payload.get("deleted_at")]

    async def update_session(self, session_id: UUID, *, phase: str, progress: int | None = None) -> InterviewSession:
        async with self._db.session() as session:
            row = await session.get(InterviewTest, session_id)
            if row is None:
                raise KeyError(f"Interview session not found: {session_id}")
            row.payload["phase"] = phase
            if progress is not None:
                row.payload["progress"] = progress
            row.payload["updated_at"] = datetime.now(timezone.utc).isoformat()
            flag_modified(row, "payload")
            return self._to_schema(row)

    async def soft_delete_session(self, user_id: UUID, session_id: UUID) -> bool:
        async with self._db.session() as session:
            row = await session.get(InterviewTest, session_id)
            if row is None or row.user_id != user_id:
                return False
            row.payload["deleted_at"] = datetime.now(timezone.utc).isoformat()
            return True

    async def soft_delete_all(self, user_id: UUID) -> int:
        async with self._db.session() as session:
            rows = await session.scalars(select(InterviewTest).where(InterviewTest.user_id == user_id))
            count = 0
            now = datetime.now(timezone.utc).isoformat()
            for row in rows:
                if row.payload.get("deleted_at"):
                    continue
                row.payload["deleted_at"] = now
                count += 1
            return count

    @staticmethod
    def _to_schema(row: InterviewTest) -> InterviewSession:
        p = row.payload or {}
        return InterviewSession(
            id=row.id,
            user_id=row.user_id,
            mode=row.mode,
            title=row.title,
            phase=p.get("phase", "interviewing"),
            progress=p.get("progress", 0),
            provider=p.get("provider"),
            model=p.get("model"),
            vacancy=VacancyContext(**p["vacancy"]) if p.get("vacancy") else None,
            created_at=p.get("created_at"),
            updated_at=p.get("updated_at"),
            deleted_at=p.get("deleted_at"),
        )
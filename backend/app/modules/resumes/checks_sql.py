from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.core.db.connection import Database
from app.core.db.models import ResumeTest
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
        now = datetime.now(timezone.utc)
        result = {
            "title": title,
            "status": "checking",
            "progress": 0,
            "source_type": source_type,
            "source_filename": source_filename,
            "source_text": source_text,
            "source_chars": len(source_text),
            "messages": [],
            "deleted_at": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        async with self._db.session() as session:
            row = ResumeTest(
                id=uuid4(),
                user_id=user_id,
                mode=mode,
                text=source_text,
                result=result,
            )
            session.add(row)
            await session.flush()
            return self._to_schema(row)

    async def get_check(self, user_id: UUID, check_id: UUID) -> ResumeCheck | None:
        async with self._db.session() as session:
            row = await session.get(ResumeTest, check_id)
            if row is None or row.user_id != user_id or row.result.get("deleted_at"):
                return None
            return self._to_schema(row)

    async def list_checks(self, user_id: UUID) -> list[ResumeCheck]:
        async with self._db.session() as session:
            rows = await session.scalars(
                select(ResumeTest).where(ResumeTest.user_id == user_id)
            )
            return [
                self._to_schema(r) for r in rows if not r.result.get("deleted_at")
            ]

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
            row = await session.get(ResumeTest, check_id)
            if row is None:
                raise KeyError(f"Resume check not found: {check_id}")
            msgs = row.result.setdefault("messages", [])

            now = datetime.now(timezone.utc)
            message = ResumeMessage(
                id=uuid4(),
                check_id=check_id,
                role=role,  # type: ignore
                content=content,
                thought=thought,
                is_feedback=is_feedback,
                status=status,  # type: ignore
                seq=len(msgs) + 1,
                created_at=now,
            )
            msgs.append(message.model_dump(mode="json"))
            row.result["updated_at"] = now.isoformat()
            flag_modified(row, "result")
            return message

    async def list_messages(self, check_id: UUID) -> list[ResumeMessage]:
        async with self._db.session() as session:
            row = await session.get(ResumeTest, check_id)
            if row is None:
                return []
            raw = row.result.get("messages", [])
            return [ResumeMessage(**m) for m in raw]

    async def update_check(self, check_id: UUID, *, status: str, progress: int | None = None) -> ResumeCheck:
        async with self._db.session() as session:
            row = await session.get(ResumeTest, check_id)
            if row is None:
                raise KeyError(f"Resume check not found: {check_id}")
            row.result["status"] = status
            if progress is not None:
                row.result["progress"] = progress
            row.result["updated_at"] = datetime.now(timezone.utc).isoformat()
            flag_modified(row, "result")
            return self._to_schema(row)

    async def soft_delete_check(self, user_id: UUID, check_id: UUID) -> bool:
        async with self._db.session() as session:
            row = await session.get(ResumeTest, check_id)
            if row is None or row.user_id != user_id:
                return False
            row.result["deleted_at"] = datetime.now(timezone.utc).isoformat()
            flag_modified(row, "result")
            return True

    @staticmethod
    def _to_schema(row: ResumeTest) -> ResumeCheck:
        p = row.result or {}
        # Конвертируем строки обратно в datetime
        created_at = p.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)

        updated_at = p.get("updated_at")
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)

        deleted_at = p.get("deleted_at")
        if isinstance(deleted_at, str):
            deleted_at = datetime.fromisoformat(deleted_at)

        return ResumeCheck(
            id=row.id,
            user_id=row.user_id,
            mode=row.mode,
            title=p.get("title", "Проверка резюме"),
            status=p.get("status", "checking"),
            progress=p.get("progress", 0),
            source_type=p.get("source_type", "text"),
            source_filename=p.get("source_filename"),
            source_text=p.get("source_text", row.text),
            source_chars=p.get("source_chars", len(row.text)),
            created_at=created_at,
            updated_at=updated_at,
            deleted_at=deleted_at,
        )
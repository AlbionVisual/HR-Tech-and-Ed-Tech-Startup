from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.core.db.connection import Database
from app.core.db.models import InterviewTest
from app.modules.interviews.schemas import InterviewMessage, InterviewMessageStatus
from sqlalchemy.orm.attributes import flag_modified

class MessagesSql:
    def __init__(self, database: Database) -> None:
        self._db = database

    async def list_messages(self, session_id: UUID) -> list[InterviewMessage]:
        async with self._db.session() as session:
            row = await session.get(InterviewTest, session_id)
            if row is None:
                return []
            raw_msgs = row.payload.get("messages", [])
            return [InterviewMessage(**m) for m in raw_msgs]
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
            row = await session.get(InterviewTest, session_id)
            if row is None:
                raise KeyError(f"Interview session not found: {session_id}")

            msgs = row.payload.setdefault("messages", [])
            message = InterviewMessage(
                id=uuid4(),
                session_id=session_id,
                role=role,
                content=content,
                thought=thought,
                is_feedback=is_feedback,
                status=status,
                seq=len(msgs) + 1,
                created_at=datetime.now(timezone.utc),
            )

            msgs.append(message.model_dump(mode="json"))
            flag_modified(row, "payload")

            return message


    async def count_messages(self, session_id: UUID) -> int:
        async with self._db.session() as session:
            row = await session.get(InterviewTest, session_id)
            if row is None:
                return 0
            return len(row.payload.get("messages", []))
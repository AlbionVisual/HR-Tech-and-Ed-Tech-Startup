from app.core.db.connection import Database
from app.modules.interviews.messages_sql import MessagesSql
from app.modules.interviews.sessions_sql import SessionsSql


class SqlInterviewRepository:
    def __init__(self, database: Database) -> None:
        self.sessions = SessionsSql(database)
        self.messages = MessagesSql(database)

    def __getattr__(self, name: str):
        for part in (self.sessions, self.messages):
            if hasattr(part, name):
                return getattr(part, name)
        raise AttributeError(f"'SqlInterviewRepository' object has no attribute '{name}'")
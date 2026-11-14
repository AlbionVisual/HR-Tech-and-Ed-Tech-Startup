from app.core.db.connection import Database
from app.modules.resumes.checks_sql import ChecksSql


class SqlResumeRepository:
    def __init__(self, database: Database) -> None:
        self.checks = ChecksSql(database)

    def __getattr__(self, name: str):
        if hasattr(self.checks, name):
            return getattr(self.checks, name)
        raise AttributeError(f"'SqlResumeRepository' object has no attribute '{name}'")
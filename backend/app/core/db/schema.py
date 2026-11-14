from app.core.db.connection import Database
from app.core.db.models import Base


async def ensure_schema(database: Database) -> None:
    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
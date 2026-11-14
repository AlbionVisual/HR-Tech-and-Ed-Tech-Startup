import argparse
import asyncio
import json
from pathlib import Path

from sqlalchemy import delete, func, select

from app.core.db.connection import Database, database
from app.core.db.models import (
    TestAttempt,
    TestAttemptAnswer,
    TestLanguage,
    TestQuestion,
    TestSet,
)


DATA_FILE = Path(__file__).parent / "data" / "tests.json"


async def seed_test_catalog(database: Database, *, reset: bool = False) -> None:
    async with database.session() as session:
        if reset:
            await session.execute(delete(TestAttemptAnswer))
            await session.execute(delete(TestAttempt))
            await session.execute(delete(TestQuestion))
            await session.execute(delete(TestSet))
            await session.execute(delete(TestLanguage))

        existing = await session.scalar(
            select(func.count()).select_from(TestLanguage)
        )
        if existing:
            return

        payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        for language_index, language_data in enumerate(payload["languages"]):
            language = TestLanguage(
                slug=language_data["slug"],
                title=language_data["title"],
                icon=language_data.get("icon", ""),
                position=language_index,
            )
            session.add(language)
            await session.flush()

            for set_index, set_data in enumerate(language_data["test_sets"]):
                test_set = TestSet(
                    language_id=language.id,
                    title=set_data.get("title") or f"Тест {set_index + 1}",
                    position=set_index,
                )
                session.add(test_set)
                await session.flush()

                for question_index, question_data in enumerate(
                    set_data["questions"]
                ):
                    session.add(
                        TestQuestion(
                            test_set_id=test_set.id,
                            text=question_data["question"],
                            options=question_data["options"],
                            correct_index=int(question_data["correct_index"]),
                            explanation=question_data.get("explanation"),
                            position=question_index,
                        )
                    )


async def _main() -> None:
    parser = argparse.ArgumentParser(description="Seed test catalog")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing tests and reload tests.json",
    )
    args = parser.parse_args()

    await database.start()
    await seed_test_catalog(database, reset=args.reset)
    await database.stop()
    print("Test catalog seeded")


if __name__ == "__main__":
    asyncio.run(_main())

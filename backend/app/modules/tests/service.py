import random
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select

from app.core.db.connection import Database
from app.core.db.models import (
    TestAttempt,
    TestAttemptAnswer,
    TestLanguage,
    TestQuestion,
    TestSet,
)
from app.modules.tests.schemas import (
    TestAnswerCreate,
    TestAnswerOut,
    TestAttemptOut,
    TestAttemptSummary,
    TestLanguageOut,
    TestQuestionOut,
    TestResultOut,
    TestStatsOut,
    TestWrongQuestion,
)


INITIAL_LIVES = 5


class TestNotFoundError(Exception):
    pass


class TestValidationError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class TestService:
    def __init__(self, database: Database) -> None:
        self.db = database

    async def list_languages(self, user_id: UUID) -> list[TestLanguageOut]:
        async with self.db.session() as session:
            languages = (
                await session.scalars(
                    select(TestLanguage).order_by(TestLanguage.position)
                )
            ).all()
            result: list[TestLanguageOut] = []
            for language in languages:
                count = await session.scalar(
                    select(func.count())
                    .select_from(TestSet)
                    .where(TestSet.language_id == language.id)
                )
                result.append(
                    TestLanguageOut(
                        slug=language.slug,
                        title=language.title,
                        icon=language.icon,
                        tests_count=int(count or 0),
                    )
                )
            return result

    async def get_stats(self, user_id: UUID) -> TestStatsOut:
        async with self.db.session() as session:
            count = await session.scalar(
                select(func.count())
                .select_from(TestAttempt)
                .where(
                    TestAttempt.user_id == user_id,
                    TestAttempt.status == "finished",
                )
            )
            return TestStatsOut(completed_count=int(count or 0))

    async def start_attempt(
        self,
        user_id: UUID,
        language_slug: str,
    ) -> TestAttemptOut:
        async with self.db.session() as session:
            language = await session.scalar(
                select(TestLanguage).where(TestLanguage.slug == language_slug)
            )
            if language is None:
                raise TestNotFoundError(f"Язык тестов не найден: {language_slug}")

            test_sets = (
                await session.scalars(
                    select(TestSet).where(TestSet.language_id == language.id)
                )
            ).all()
            if not test_sets:
                raise TestNotFoundError("Для языка нет тестов.")

            test_set = random.choice(list(test_sets))
            questions = (
                await session.scalars(
                    select(TestQuestion)
                    .where(TestQuestion.test_set_id == test_set.id)
                    .order_by(TestQuestion.position)
                )
            ).all()
            if not questions:
                raise TestNotFoundError("В тесте нет вопросов.")

            attempt = TestAttempt(
                user_id=user_id,
                language_id=language.id,
                test_set_id=test_set.id,
                status="in_progress",
                lives=INITIAL_LIVES,
                correct_count=0,
                answered_count=0,
                total_count=len(questions),
            )
            session.add(attempt)
            await session.flush()

            return TestAttemptOut(
                attempt_id=attempt.id,
                language=language.slug,
                language_title=language.title,
                total=len(questions),
                lives=attempt.lives,
                questions=[
                    TestQuestionOut(
                        id=question.id,
                        question=question.text,
                        options=list(question.options or []),
                    )
                    for question in questions
                ],
            )

    async def answer(
        self,
        user_id: UUID,
        attempt_id: UUID,
        payload: TestAnswerCreate,
    ) -> TestAnswerOut:
        async with self.db.session() as session:
            attempt = await session.get(TestAttempt, attempt_id)
            if attempt is None or attempt.user_id != user_id:
                raise TestNotFoundError("Попытка теста не найдена.")
            if attempt.status != "in_progress":
                raise TestValidationError(
                    "attempt_finished",
                    "Эта попытка уже завершена.",
                    status_code=409,
                )

            question = await session.get(TestQuestion, payload.question_id)
            if question is None or question.test_set_id != attempt.test_set_id:
                raise TestNotFoundError("Вопрос не найден в этой попытке.")

            existing = await session.scalar(
                select(TestAttemptAnswer).where(
                    TestAttemptAnswer.attempt_id == attempt.id,
                    TestAttemptAnswer.question_id == question.id,
                )
            )
            if existing is not None:
                raise TestValidationError(
                    "already_answered",
                    "На этот вопрос уже дан ответ.",
                    status_code=409,
                )

            options = list(question.options or [])
            if payload.selected_index < 0 or payload.selected_index >= len(options):
                raise TestValidationError(
                    "invalid_option",
                    "Выбран недопустимый вариант ответа.",
                )

            is_correct = payload.selected_index == question.correct_index
            attempt.answered_count += 1
            if is_correct:
                attempt.correct_count += 1
            else:
                attempt.lives = max(0, attempt.lives - 1)

            finished = attempt.lives == 0
            if finished:
                attempt.status = "finished"
                attempt.finished_at = datetime.now(timezone.utc)

            session.add(
                TestAttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_index=payload.selected_index,
                    is_correct=is_correct,
                )
            )
            await session.flush()

            return TestAnswerOut(
                question_id=question.id,
                selected_index=payload.selected_index,
                correct_index=question.correct_index,
                correct_option=options[question.correct_index],
                is_correct=is_correct,
                lives=attempt.lives,
                answered_count=attempt.answered_count,
                correct_count=attempt.correct_count,
                finished=finished,
            )

    async def finish(self, user_id: UUID, attempt_id: UUID) -> TestResultOut:
        async with self.db.session() as session:
            attempt = await session.get(TestAttempt, attempt_id)
            if attempt is None or attempt.user_id != user_id:
                raise TestNotFoundError("Попытка теста не найдена.")

            if attempt.status == "in_progress":
                attempt.status = "finished"
                attempt.finished_at = datetime.now(timezone.utc)
                await session.flush()

            language = await session.get(TestLanguage, attempt.language_id)
            questions = {
                question.id: question
                for question in (
                    await session.scalars(
                        select(TestQuestion).where(
                            TestQuestion.test_set_id == attempt.test_set_id
                        )
                    )
                ).all()
            }
            answers = (
                await session.scalars(
                    select(TestAttemptAnswer).where(
                        TestAttemptAnswer.attempt_id == attempt.id
                    )
                )
            ).all()

            wrong: list[TestWrongQuestion] = []
            for answer in answers:
                question = questions.get(answer.question_id)
                if question is None or answer.is_correct:
                    continue
                options = list(question.options or [])
                wrong.append(
                    TestWrongQuestion(
                        question=question.text,
                        options=options,
                        selected_index=answer.selected_index,
                        correct_index=question.correct_index,
                        correct_option=options[question.correct_index],
                    )
                )

            return TestResultOut(
                attempt_id=attempt.id,
                language=language.slug if language else "",
                language_title=language.title if language else "",
                correct_count=attempt.correct_count,
                total=attempt.total_count,
                lives=attempt.lives,
                wrong_questions=wrong,
            )

    async def list_attempts(self, user_id: UUID) -> list[TestAttemptSummary]:
        async with self.db.session() as session:
            attempts = (
                await session.scalars(
                    select(TestAttempt)
                    .where(TestAttempt.user_id == user_id)
                    .order_by(TestAttempt.created_at.desc())
                )
            ).all()
            result: list[TestAttemptSummary] = []
            for attempt in attempts:
                language = await session.get(TestLanguage, attempt.language_id)
                result.append(
                    TestAttemptSummary(
                        id=attempt.id,
                        language=language.slug if language else "",
                        language_title=language.title if language else "",
                        correct_count=attempt.correct_count,
                        total=attempt.total_count,
                        lives=attempt.lives,
                        status=attempt.status,
                        created_at=attempt.created_at,
                        finished_at=attempt.finished_at,
                    )
                )
            return result

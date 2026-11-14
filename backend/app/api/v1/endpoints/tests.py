from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.deps import get_test_service
from app.core.deps import get_current_user_id
from app.modules.tests.schemas import (
    TestAnswerCreate,
    TestAnswerOut,
    TestAttemptCreate,
    TestAttemptOut,
    TestAttemptSummary,
    TestLanguageOut,
    TestResultOut,
    TestStatsOut,
)
from app.modules.tests.service import TestService


router = APIRouter()


@router.get("/languages", response_model=list[TestLanguageOut])
async def list_languages(
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> list[TestLanguageOut]:
    return await service.list_languages(user_id)


@router.get("/stats", response_model=TestStatsOut)
async def get_stats(
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> TestStatsOut:
    return await service.get_stats(user_id)


@router.post("/attempts", response_model=TestAttemptOut)
async def start_attempt(
    payload: TestAttemptCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> TestAttemptOut:
    return await service.start_attempt(user_id, payload.language)


@router.post("/attempts/{attempt_id}/answers", response_model=TestAnswerOut)
async def answer_question(
    attempt_id: UUID,
    payload: TestAnswerCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> TestAnswerOut:
    return await service.answer(user_id, attempt_id, payload)


@router.post("/attempts/{attempt_id}/finish", response_model=TestResultOut)
async def finish_attempt(
    attempt_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> TestResultOut:
    return await service.finish(user_id, attempt_id)


@router.get("/attempts", response_model=list[TestAttemptSummary])
async def list_attempts(
    user_id: UUID = Depends(get_current_user_id),
    service: TestService = Depends(get_test_service),
) -> list[TestAttemptSummary]:
    return await service.list_attempts(user_id)

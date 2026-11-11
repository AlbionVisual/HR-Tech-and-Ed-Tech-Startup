from uuid import UUID

from fastapi import APIRouter, Depends, File, Response, UploadFile
from fastapi.responses import StreamingResponse

from app.api.v1.deps import get_resume_service
from app.api.v1.sse import sse_response
from app.core.deps import get_current_user_id
from app.core.sse import sse
from app.modules.resumes.schemas import (
    ResumeCheck,
    ResumeCheckCreate,
    ResumeCheckDetail,
    ResumeCheckSummary,
    ResumeExtractResponse,
    ResumeMessage,
    ResumeMessageCreate,
)
from app.modules.resumes.service import ResumeService
from app.modules.resumes.validators import MAX_FILE_SIZE


router = APIRouter()


def _stream(
    service: ResumeService,
    check: ResumeCheck,
    message: ResumeMessage,
) -> StreamingResponse:
    async def events():
        yield sse(
            {
                "type": "meta",
                "check_id": str(check.id),
                "user_message_id": str(message.id),
            }
        )
        async for event in service.stream_turn(check):
            yield sse(event)

    return sse_response(events())


@router.post("/extract", response_model=ResumeExtractResponse)
async def extract_resume(
    file: UploadFile = File(...),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeExtractResponse:
    data = await file.read(MAX_FILE_SIZE + 1)
    return await service.extract(file.filename, file.content_type, data)


@router.post("/checks:stream")
async def start_check(
    payload: ResumeCheckCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: ResumeService = Depends(get_resume_service),
) -> StreamingResponse:
    check, message = await service.create_check(user_id, payload)
    return _stream(service, check, message)


@router.post("/checks/{check_id}/messages:stream")
async def continue_check(
    check_id: UUID,
    payload: ResumeMessageCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: ResumeService = Depends(get_resume_service),
) -> StreamingResponse:
    check, message = await service.begin_follow_up(user_id, check_id, payload)
    return _stream(service, check, message)


@router.get("/checks", response_model=list[ResumeCheckSummary])
async def list_checks(
    user_id: UUID = Depends(get_current_user_id),
    service: ResumeService = Depends(get_resume_service),
) -> list[ResumeCheckSummary]:
    return await service.list_checks(user_id)


@router.get("/checks/{check_id}", response_model=ResumeCheckDetail)
async def get_check(
    check_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeCheckDetail:
    return await service.get_check(user_id, check_id)


@router.delete("/checks/{check_id}", status_code=204)
async def delete_check(
    check_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: ResumeService = Depends(get_resume_service),
) -> Response:
    await service.delete_check(user_id, check_id)
    return Response(status_code=204)

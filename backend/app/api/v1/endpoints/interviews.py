from uuid import UUID

from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse

from app.api.v1.deps import get_interview_service
from app.api.v1.sse import sse_response
from app.core.deps import get_current_user_id
from app.core.sse import sse
from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMessageCreate,
    InterviewSession,
    InterviewSessionCreate,
    InterviewSessionDetail,
    InterviewSessionSummary,
)
from app.modules.interviews.service import InterviewService


router = APIRouter()


def _stream(
    service: InterviewService,
    session: InterviewSession,
    *,
    user_message: InterviewMessage | None = None,
    next_question: bool = False,
) -> StreamingResponse:
    async def events():
        yield sse(
            {
                "type": "meta",
                "interview_id": str(session.id),
                "user_message_id": (
                    str(user_message.id) if user_message is not None else None
                ),
            }
        )
        async for event in service.stream_turn(
            session,
            next_question=next_question,
        ):
            yield sse(event)

    return sse_response(events())


@router.post("/interviews:stream")
async def start_interview(
    payload: InterviewSessionCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> StreamingResponse:
    session = await service.create_session(user_id, payload)
    return _stream(service, session)


@router.post("/interviews/{session_id}/messages:stream")
async def continue_interview(
    session_id: UUID,
    payload: InterviewMessageCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> StreamingResponse:
    session, message = await service.begin_follow_up(user_id, session_id, payload)
    return _stream(service, session, user_message=message)


@router.post("/interviews/{session_id}/next-question:stream")
async def next_question(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> StreamingResponse:
    session = await service.begin_next_question(user_id, session_id)
    return _stream(service, session, next_question=True)


@router.get("/interviews", response_model=list[InterviewSessionSummary])
async def list_interviews(
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> list[InterviewSessionSummary]:
    return await service.list_sessions(user_id)


@router.get("/interviews/{session_id}", response_model=InterviewSessionDetail)
async def get_interview(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> InterviewSessionDetail:
    return await service.get_session(user_id, session_id)


@router.delete("/interviews/{session_id}", status_code=204)
async def delete_interview(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> Response:
    await service.delete_session(user_id, session_id)
    return Response(status_code=204)


@router.delete("/interviews", status_code=204)
async def clear_interviews(
    user_id: UUID = Depends(get_current_user_id),
    service: InterviewService = Depends(get_interview_service),
) -> Response:
    await service.clear_sessions(user_id)
    return Response(status_code=204)

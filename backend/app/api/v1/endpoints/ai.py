from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.core.ai.service import AiChatService, AiRequestError, ChatRequest
from app.core.config import settings

router = APIRouter()


def get_ai_service(request: Request) -> AiChatService:
    return AiChatService(
        settings=settings,
        http=getattr(request.app.state, "http", None),
    )


@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    service: AiChatService = Depends(get_ai_service),
) -> StreamingResponse:
    try:
        prepared = service.prepare(payload)
    except AiRequestError as error:
        raise HTTPException(
            status_code=400,
            detail={"code": "bad_request", "message": str(error)},
        ) from error

    return StreamingResponse(
        service.stream(prepared),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/models")
async def models(service: AiChatService = Depends(get_ai_service)) -> dict:
    return service.models_payload()


@router.get("/probe")
async def probe(
    provider: str = Query("gemini"),
    service: AiChatService = Depends(get_ai_service),
) -> dict:
    return await service.probe(provider)

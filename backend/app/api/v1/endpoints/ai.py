from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.v1.deps import get_ai_service
from app.api.v1.sse import sse_response
from app.core.ai.schemas import ChatRequest
from app.core.ai.service import AiChatService

router = APIRouter()


@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    service: AiChatService = Depends(get_ai_service),
) -> StreamingResponse:
    return sse_response(service.stream(service.prepare(payload)))


@router.get("/models")
async def models(service: AiChatService = Depends(get_ai_service)) -> dict:
    return service.models_payload()


@router.get("/probe")
async def probe(
    provider: str = Query("gemini"),
    service: AiChatService = Depends(get_ai_service),
) -> dict:
    return await service.probe(provider)

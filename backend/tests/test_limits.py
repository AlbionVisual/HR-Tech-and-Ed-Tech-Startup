import asyncio
import time
from io import BytesIO

import pytest
from starlette.datastructures import Headers, UploadFile

from app.core.limits import RateLimiter, RateLimitExceeded
from app.main import app
from app.modules.resumes.service import ResumeService


CHAT_PAYLOAD = {
    "task": "interview",
    "mode": "practice",
    "messages": [],
    "provider": "mock",
    "model": "demo",
}


async def test_rate_limiter_blocks_after_limit() -> None:
    limiter = RateLimiter(2, 60)
    await limiter.hit("user")
    await limiter.hit("user")
    with pytest.raises(RateLimitExceeded) as error:
        await limiter.hit("user")
    assert error.value.retry_after >= 1


async def test_rate_limiter_separates_keys() -> None:
    limiter = RateLimiter(1, 60)
    await limiter.hit("a")
    await limiter.hit("b")
    with pytest.raises(RateLimitExceeded):
        await limiter.hit("a")


async def test_rate_limiter_window_expires() -> None:
    limiter = RateLimiter(1, 0.05)
    await limiter.hit("user")
    await asyncio.sleep(0.06)
    await limiter.hit("user")


async def test_ai_endpoint_returns_429(client) -> None:
    app.state.ai_rate_limiter = RateLimiter(1, 60)

    first = await client.post("/api/v1/ai/chat/stream", json=CHAT_PAYLOAD)
    assert first.status_code == 200

    second = await client.post("/api/v1/ai/chat/stream", json=CHAT_PAYLOAD)
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "rate_limited"
    assert int(second.headers["retry-after"]) >= 1


async def test_ready_checks_database(client) -> None:
    response = await client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "up"}


async def test_resume_parsing_is_serialized(monkeypatch) -> None:
    active = 0
    peak = 0

    def fake_extract(source_type: str, data: bytes) -> str:
        nonlocal active, peak
        active += 1
        peak = max(peak, active)
        time.sleep(0.05)
        active -= 1
        return "Python, FastAPI"

    monkeypatch.setattr("app.modules.resumes.service.extract_text", fake_extract)
    service = ResumeService(None, None, parse_semaphore=asyncio.Semaphore(1))

    first, second = await asyncio.gather(
        service.extract("a.pdf", "application/pdf", b"%PDF-a"),
        service.extract("b.pdf", "application/pdf", b"%PDF-b"),
    )

    assert first.text == "Python, FastAPI"
    assert second.text == "Python, FastAPI"
    assert peak == 1


async def test_extract_upload_reads_file(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.resumes.service.extract_text",
        lambda source_type, data: "Python, FastAPI",
    )
    service = ResumeService(None, None, parse_semaphore=asyncio.Semaphore(1))
    upload = UploadFile(
        file=BytesIO(b"%PDF-fake"),
        filename="cv.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )

    result = await service.extract_upload(
        upload.filename,
        upload.content_type,
        upload,
    )

    assert result.filename == "cv.pdf"
    assert result.source_type == "pdf"
    assert result.text == "Python, FastAPI"

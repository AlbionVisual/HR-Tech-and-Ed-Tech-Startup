async def test_models_include_mock(client) -> None:
    response = await client.get("/api/v1/ai/models")
    assert response.status_code == 200
    payload = response.json()
    assert any(provider["id"] == "mock" for provider in payload["providers"])
    assert payload["default"]["provider"]


async def test_chat_stream_returns_sse(client) -> None:
    response = await client.post(
        "/api/v1/ai/chat/stream",
        json={
            "task": "interview",
            "mode": "practice",
            "messages": [],
            "provider": "mock",
            "model": "demo",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert '"type": "delta"' in response.text
    assert '"type": "done"' in response.text


async def test_chat_rejects_unknown_mode(client) -> None:
    response = await client.post(
        "/api/v1/ai/chat/stream",
        json={
            "task": "interview",
            "mode": "unknown",
            "messages": [],
            "provider": "mock",
            "model": "demo",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "bad_request"


async def test_resume_requires_messages(client) -> None:
    response = await client.post(
        "/api/v1/ai/chat/stream",
        json={
            "task": "resume",
            "mode": "ats_check",
            "messages": [],
            "provider": "mock",
            "model": "demo",
        },
    )
    assert response.status_code == 400

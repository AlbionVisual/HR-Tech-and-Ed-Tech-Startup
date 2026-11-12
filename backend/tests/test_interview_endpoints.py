import json

import pytest

from app.modules.interviews.repository import interview_repository


@pytest.fixture(autouse=True)
def reset_interview_repository():
    interview_repository.clear()
    yield
    interview_repository.clear()


def events(response) -> list[dict]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]


async def start_practice(client) -> tuple[str, list[dict]]:
    response = await client.post(
        "/api/v1/interviews:stream",
        json={"mode": "practice", "provider": "mock", "model": "demo"},
    )
    assert response.status_code == 200
    result = events(response)
    meta = next(event for event in result if event["type"] == "meta")
    return meta["interview_id"], result


async def test_interview_lifecycle(client) -> None:
    session_id, stream = await start_practice(client)

    assert [event["type"] for event in stream][:3] == [
        "meta",
        "thinking",
        "thought",
    ]
    assert any(event["type"] == "delta" for event in stream)
    done = next(event for event in stream if event["type"] == "done")
    assert done["interview_id"] == session_id
    assert done["phase"] == "interviewing"
    assert done["assistant_message_id"]

    listing = await client.get("/api/v1/interviews")
    assert listing.status_code == 200
    summary = next(item for item in listing.json() if item["id"] == session_id)
    assert summary["title"] == "Тренировка"
    assert summary["provider"] == "mock"
    assert summary["model"] == "demo"
    assert summary["messages_count"] == 1
    assert summary["last_message"]

    detail = await client.get(f"/api/v1/interviews/{session_id}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["vacancy"] is None
    assert [message["role"] for message in payload["messages"]] == ["assistant"]

    follow_up = await client.post(
        f"/api/v1/interviews/{session_id}/messages:stream",
        json={"content": "Расскажи подробнее о проекте."},
    )
    assert follow_up.status_code == 200
    follow_events = events(follow_up)
    follow_done = next(event for event in follow_events if event["type"] == "done")
    assert follow_done["phase"] == "awaiting_next"

    detail = await client.get(f"/api/v1/interviews/{session_id}")
    messages = detail.json()["messages"]
    assert [message["role"] for message in messages] == [
        "assistant",
        "user",
        "assistant",
    ]
    assert messages[-1]["is_feedback"] is True

    next_question = await client.post(
        f"/api/v1/interviews/{session_id}/next-question:stream"
    )
    assert next_question.status_code == 200
    next_done = next(
        event for event in events(next_question) if event["type"] == "done"
    )
    assert next_done["phase"] == "interviewing"

    deleted = await client.delete(f"/api/v1/interviews/{session_id}")
    assert deleted.status_code == 204
    missing = await client.get(f"/api/v1/interviews/{session_id}")
    assert missing.status_code == 404
    assert missing.json()["detail"]["code"] == "not_found"


async def test_vacancy_interview(client) -> None:
    response = await client.post(
        "/api/v1/interviews:stream",
        json={
            "mode": "vacancy",
            "vacancy": {
                "company": "Acme",
                "grade": "middle",
                "description": "Python backend developer.",
            },
            "provider": "mock",
            "model": "demo",
        },
    )
    assert response.status_code == 200
    result = events(response)
    session_id = next(
        event for event in result if event["type"] == "meta"
    )["interview_id"]

    detail = await client.get(f"/api/v1/interviews/{session_id}")
    payload = detail.json()
    assert payload["title"] == "Вакансия: Acme"
    assert payload["vacancy"]["company"] == "Acme"
    assert payload["mode"] == "vacancy"


async def test_empty_message_is_rejected(client) -> None:
    session_id, _ = await start_practice(client)

    response = await client.post(
        f"/api/v1/interviews/{session_id}/messages:stream",
        json={"content": "   "},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "empty_message"


async def test_next_question_requires_feedback(client) -> None:
    session_id, _ = await start_practice(client)

    response = await client.post(
        f"/api/v1/interviews/{session_id}/next-question:stream"
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "invalid_state"


async def test_clear_interviews(client) -> None:
    first_id, _ = await start_practice(client)
    second_id, _ = await start_practice(client)

    response = await client.delete("/api/v1/interviews")
    assert response.status_code == 204

    listing = await client.get("/api/v1/interviews")
    assert listing.status_code == 200
    assert listing.json() == []

    assert (
        await client.get(f"/api/v1/interviews/{first_id}")
    ).status_code == 404
    assert (
        await client.get(f"/api/v1/interviews/{second_id}")
    ).status_code == 404

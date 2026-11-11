import json


def events(response) -> list[dict]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]


async def start_check(client) -> tuple[str, list[dict]]:
    response = await client.post(
        "/api/v1/resumes/checks:stream",
        json={
            "mode": "ats_check",
            "text": "Резюме: Python, FastAPI, 5 лет опыта.",
            "source_type": "text",
        },
    )
    assert response.status_code == 200
    result = events(response)
    done = next(event for event in result if event["type"] == "done")
    return done["check_id"], result


async def test_resume_check_lifecycle(client) -> None:
    check_id, stream = await start_check(client)
    assert [event["type"] for event in stream][:3] == [
        "meta",
        "thinking",
        "thought",
    ]
    assert any(event["type"] == "delta" for event in stream)
    assert stream[-1] == {
        "type": "done",
        "check_id": check_id,
        "assistant_message_id": stream[-1]["assistant_message_id"],
        "status": "checking",
    }

    listing = await client.get("/api/v1/resumes/checks")
    assert listing.status_code == 200
    summary = next(item for item in listing.json() if item["id"] == check_id)
    assert summary["title"] == "Проверка ATS"
    assert summary["messages_count"] == 2
    assert summary["status"] == "checking"

    detail = await client.get(f"/api/v1/resumes/checks/{check_id}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["source_text"].startswith("Резюме:")
    assert [message["role"] for message in payload["messages"]] == [
        "user",
        "assistant",
    ]

    follow_up = await client.post(
        f"/api/v1/resumes/checks/{check_id}/messages:stream",
        json={"content": "следующий вопрос"},
    )
    assert follow_up.status_code == 200
    follow_events = events(follow_up)
    assert any(event["type"] == "feedback" for event in follow_events)
    assert follow_events[-1]["status"] == "awaiting_next"

    deleted = await client.delete(f"/api/v1/resumes/checks/{check_id}")
    assert deleted.status_code == 204

    missing = await client.get(f"/api/v1/resumes/checks/{check_id}")
    assert missing.status_code == 404
    assert missing.json()["detail"]["code"] == "not_found"

async def test_catalog_and_attempt_lifecycle(client) -> None:
    languages = await client.get("/api/v1/tests/languages")
    assert languages.status_code == 200
    payload = languages.json()
    assert {item["slug"] for item in payload} == {"python", "java", "cpp"}
    assert all(item["tests_count"] == 5 for item in payload)

    stats = await client.get("/api/v1/tests/stats")
    assert stats.status_code == 200
    assert stats.json()["completed_count"] == 0

    attempt_response = await client.post(
        "/api/v1/tests/attempts",
        json={"language": "python"},
    )
    assert attempt_response.status_code == 200
    attempt = attempt_response.json()
    assert attempt["total"] == 10
    assert attempt["lives"] == 5
    assert len(attempt["questions"]) == 10
    assert "correct_index" not in attempt["questions"][0]

    attempt_id = attempt["attempt_id"]
    answered = 0
    for question in attempt["questions"]:
        answer_response = await client.post(
            f"/api/v1/tests/attempts/{attempt_id}/answers",
            json={"question_id": question["id"], "selected_index": 0},
        )
        assert answer_response.status_code == 200
        answer = answer_response.json()
        assert answer["correct_option"]
        assert "correct_index" in answer
        answered += 1
        if answer["finished"]:
            break

    assert answered >= 1

    finish_response = await client.post(
        f"/api/v1/tests/attempts/{attempt_id}/finish"
    )
    assert finish_response.status_code == 200
    result = finish_response.json()
    assert result["attempt_id"] == attempt_id
    assert result["total"] == 10
    assert result["correct_count"] >= 0

    stats = await client.get("/api/v1/tests/stats")
    assert stats.json()["completed_count"] == 1


async def test_attempt_rejects_unknown_language(client) -> None:
    response = await client.post(
        "/api/v1/tests/attempts",
        json={"language": "unknown"},
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "not_found"


async def test_attempt_rejects_double_answer(client) -> None:
    attempt = (
        await client.post(
            "/api/v1/tests/attempts",
            json={"language": "java"},
        )
    ).json()
    question = attempt["questions"][0]
    body = {"question_id": question["id"], "selected_index": 0}

    first = await client.post(
        f"/api/v1/tests/attempts/{attempt['attempt_id']}/answers",
        json=body,
    )
    assert first.status_code == 200

    second = await client.post(
        f"/api/v1/tests/attempts/{attempt['attempt_id']}/answers",
        json=body,
    )
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "already_answered"

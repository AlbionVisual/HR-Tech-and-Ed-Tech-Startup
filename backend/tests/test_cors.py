from uuid import uuid4


async def test_cors_allows_delete(client) -> None:
    response = await client.options(
        f"/api/v1/resumes/checks/{uuid4()}",
        headers={
            "Origin": "http://localhost:5273",
            "Access-Control-Request-Method": "DELETE",
        },
    )
    assert response.status_code == 200
    assert "DELETE" in response.headers["access-control-allow-methods"]

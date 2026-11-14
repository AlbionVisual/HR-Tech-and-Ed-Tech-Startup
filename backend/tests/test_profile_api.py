async def test_profile_read_and_update(client):
    response = await client.get("/api/v1/profile")
    assert response.status_code == 200, response.text
    profile = response.json()
    assert profile["display_name"] == "Test user"
    assert profile["identities"] == []

    response = await client.patch(
        "/api/v1/profile",
        json={"display_name": "Bob", "profile": {"theme": "dark"}},
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["display_name"] == "Bob"
    assert updated["profile"]["theme"] == "dark"

    response = await client.get("/api/v1/profile")
    assert response.status_code == 200
    assert response.json()["display_name"] == "Bob"

    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["display_name"] == "Bob"

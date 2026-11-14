async def test_create_and_login(client):
    response = await client.post(
        "/api/v1/profile/users",
        json={"username": "bob", "password": "secret123", "profile": {"x": 1}},
    )
    assert response.status_code == 200, response.text
    user = response.json()
    assert user["username"] == "bob"

    response = await client.post(
        "/api/v1/profile/login",
        json={"username": "bob", "password": "secret123"},
    )
    assert response.status_code == 200

    response = await client.post(
        "/api/v1/profile/login",
        json={"username": "bob", "password": "wrong"},
    )
    assert response.status_code == 401

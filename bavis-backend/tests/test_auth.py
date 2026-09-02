import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin_test", "password": "pass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["username"] == "admin_test"


@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin_test", "password": "wrongpassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    # Login first
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "operator_test", "password": "pass123"}
    )
    token = login_resp.json()["access_token"]

    # Call /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    data = me_resp.json()
    assert data["username"] == "operator_test"
    assert data["role"] == "operator"

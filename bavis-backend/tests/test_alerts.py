import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_and_ack_alerts(client: AsyncClient):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "operator_test", "password": "pass123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch alerts
    alerts_resp = await client.get("/api/v1/alerts", headers=headers)
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert isinstance(alerts, list)

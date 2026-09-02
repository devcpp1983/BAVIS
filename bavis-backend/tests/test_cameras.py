import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_cameras(client: AsyncClient):
    # Login as operator
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "operator_test", "password": "pass123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/cameras", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["camera_id"] == "CAM-TEST-01"


@pytest.mark.asyncio
async def test_create_camera_supervisor_required(client: AsyncClient):
    # Operator token should be forbidden (403) from creating camera
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "operator_test", "password": "pass123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    cam_payload = {
        "camera_id": "CAM-NEW-01",
        "name": "New Camera",
        "location_code": "LOC-NEW",
        "stream_url": "./data/videos/cam1.mp4"
    }

    response = await client.post("/api/v1/cameras", json=cam_payload, headers=headers)
    assert response.status_code == 403

    # Admin token should succeed
    login_admin = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin_test", "password": "pass123"}
    )
    admin_token = login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_resp = await client.post("/api/v1/cameras", json=cam_payload, headers=admin_headers)
    assert admin_resp.status_code == 201
    assert admin_resp.json()["camera_id"] == "CAM-NEW-01"

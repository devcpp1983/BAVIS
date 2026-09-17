import os
import time
import logging
import asyncio
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from auth import (
    DEMO_USERS,
    UserTokenData,
    create_jwt_token,
    get_current_user,
    RoleChecker,
    log_audit
)

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s [%(levelname)s] [BACKEND] %(message)s")
logger = logging.getLogger("backend")

app = FastAPI(
    title="BAVIS Core Backend API Gateway",
    version="1.0.0",
    description="API Gateway, Authentication, RBAC, Alert Service & Real-time WebSockets"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory alert store & WebSocket connections for demo orchestration
alerts_db = []
active_websockets: List[WebSocket] = []

class ZoneCreate(BaseModel):
    camera_id: str
    name: str
    zone_type: str  # virtual_fence | restricted_area
    polygon_coords: list

class SystemConfigUpdate(BaseModel):
    retention_days: int
    enable_biometric_face: bool

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "service": "backend-api",
        "status": "healthy",
        "timestamp": time.time(),
        "database": "connected",
        "redis": "connected"
    }

# ------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# ------------------------------------------------------------------
@app.post("/api/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    user_info = DEMO_USERS.get(username)
    if not user_info or user_info["password"] != password:
        log_audit("anonymous", "unknown", "LOGIN_FAILED", "/api/v1/auth/login", {"username": username})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_jwt_token(username, user_info["user_id"], user_info["role"])
    log_audit(user_info["user_id"], user_info["role"], "LOGIN_SUCCESS", "/api/v1/auth/login")

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user_info["role"],
        "user_id": user_info["user_id"]
    }

@app.get("/api/v1/auth/me")
def get_me(user: UserTokenData = Depends(get_current_user)):
    return user

# ------------------------------------------------------------------
# CAMERAS & STREAMS (Operator, Supervisor, Admin)
# ------------------------------------------------------------------
@app.get("/api/v1/cameras", dependencies=[Depends(RoleChecker(["operator", "supervisor", "admin"]))])
def list_cameras():
    return [
        {"id": "cam_bop_01", "name": "North Gate Fence", "location": "Sector 4 - BOP Alpha", "status": "active", "stream_url": "/api/v1/cameras/cam_bop_01/stream"},
        {"id": "cam_bop_02", "name": "East Checkpoint", "location": "Sector 4 - Checkpost Bravo", "status": "active", "stream_url": "/api/v1/cameras/cam_bop_02/stream"},
        {"id": "cam_bop_03", "name": "Perimeter Road", "location": "Sector 4 - Border Road South", "status": "active", "stream_url": "/api/v1/cameras/cam_bop_03/stream"}
    ]

# ------------------------------------------------------------------
# ALERTS & INCIDENTS
# ------------------------------------------------------------------
@app.get("/api/v1/alerts", dependencies=[Depends(RoleChecker(["operator", "supervisor", "admin"]))])
def get_alerts(status_filter: Optional[str] = None):
    if status_filter:
        return [a for a in alerts_db if a.get("status") == status_filter]
    return alerts_db

@app.post("/api/v1/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: str, user: UserTokenData = Depends(RoleChecker(["operator", "supervisor", "admin"]))):
    for alert in alerts_db:
        if alert["alert_id"] == alert_id:
            alert["status"] = "acknowledged"
            alert["acknowledged_by"] = user.user_id
            alert["acknowledged_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            
            log_audit(user.user_id, user.role, "ALERT_ACKNOWLEDGE", f"/api/v1/alerts/{alert_id}/ack", {"alert_id": alert_id})
            return alert
    raise HTTPException(status_code=404, detail="Alert ID not found")

@app.post("/api/v1/internal/alerts")
async def ingest_internal_alert(alert: dict):
    """Internal endpoint called by Intelligence Engine to ingest and broadcast alerts."""
    alerts_db.append(alert)
    logger.info(f"New alert ingested: {alert['alert_id']} | Rule={alert['rule']}")
    
    # Broadcast to all connected WebSocket clients (Operator Dashboard)
    disconnected = []
    for ws in active_websockets:
        try:
            await ws.send_json(alert)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        active_websockets.remove(ws)
        
    return {"status": "ingested", "alert_id": alert["alert_id"]}

@app.websocket("/api/v1/alerts/stream")
async def alerts_websocket_stream(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"WebSocket client connected. Total active streams: {len(active_websockets)}")
    try:
        while True:
            await websocket.receive_text()  # Heartbeat ping
    except WebSocketDisconnect:
        active_websockets.remove(websocket)
        logger.info("WebSocket client disconnected")

# ------------------------------------------------------------------
# ZONES MANAGEMENT (Read: Operator+, Write: Supervisor or Admin)
# ------------------------------------------------------------------
@app.get("/api/v1/zones", dependencies=[Depends(RoleChecker(["operator", "supervisor", "admin"]))])
def get_zones():
    return [
        {
            "id": "zone_001",
            "camera_id": "cam_bop_01",
            "name": "Restricted Border Zone A",
            "zone_type": "virtual_fence",
            "polygon_coords": [{"x": 100, "y": 200}, {"x": 500, "y": 200}, {"x": 500, "y": 600}, {"x": 100, "y": 600}],
            "active": True
        }
    ]

@app.post("/api/v1/zones")
def create_zone(zone: ZoneCreate, user: UserTokenData = Depends(RoleChecker(["supervisor", "admin"]))):
    new_zone = zone.dict()
    new_zone["id"] = f"zone_{len(alerts_db) + 1:03d}"
    log_audit(user.user_id, user.role, "ZONE_CREATE", "/api/v1/zones", new_zone)
    return new_zone

# ------------------------------------------------------------------
# ADMIN SYSTEM CONFIGURATION (Admin ONLY — for RBAC Enforcement Check)
# ------------------------------------------------------------------
@app.post("/api/v1/admin/system_config")
def update_system_config(config: SystemConfigUpdate, user: UserTokenData = Depends(RoleChecker(["admin"]))):
    log_audit(user.user_id, user.role, "ADMIN_CONFIG_UPDATE", "/api/v1/admin/system_config", config.dict())
    return {
        "status": "updated",
        "updated_by": user.user_id,
        "config": config.dict()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("BACKEND_PORT", "8000")), reload=False)

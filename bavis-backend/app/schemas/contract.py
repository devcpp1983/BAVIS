from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "operator"  # admin, supervisor, operator


class UserOut(BaseModel):
    id: str
    username: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Shared Contracts (Section 8) ---

class DetectionEvent(BaseModel):
    camera_id: str
    frame_ts: str
    object_type: str  # person | vehicle | face
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    track_id: str


class AlertEvent(BaseModel):
    alert_id: str
    event_id: str
    severity: str  # low | medium | high
    rule: str
    status: str  # new | acknowledged | resolved
    created_at: str
    acknowledged_by: Optional[str] = None
    evidence_ref: Optional[str] = None
    camera_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertAckRequest(BaseModel):
    acknowledged_by: Optional[str] = None


# --- Camera Schemas ---

class CameraCreate(BaseModel):
    camera_id: str
    name: str
    location_code: str
    stream_url: str
    status: str = "online"
    configuration: Optional[Dict[str, Any]] = {}


class CameraOut(BaseModel):
    camera_id: str
    name: str
    location_code: str
    stream_url: str
    status: str
    configuration: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


# --- Zone Schemas ---

class ZoneCreate(BaseModel):
    camera_id: str
    name: Optional[str] = "Restricted Zone"
    geometry: Dict[str, Any]  # polygon or line coordinates
    rule_type: str  # virtual_fence, dwell, intrusion
    threshold: Optional[Dict[str, Any]] = {}


class ZoneOut(BaseModel):
    zone_id: str
    camera_id: str
    name: str
    geometry: Dict[str, Any]
    rule_type: str
    threshold: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


# --- Evidence & Event Schemas ---

class EvidenceOut(BaseModel):
    evidence_id: str
    event_id: str
    snapshot_ref: str
    retention_metadata: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class SecurityEventOut(BaseModel):
    id: str
    frame_ts: datetime
    camera_id: str
    object_type: str
    confidence: float
    bbox: List[float]
    track_id: str

    model_config = ConfigDict(from_attributes=True)

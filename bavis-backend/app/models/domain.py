from datetime import datetime
import uuid
from sqlalchemy import String, Float, DateTime, Boolean, JSON, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="operator")  # admin, supervisor, operator
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Camera(Base):
    __tablename__ = "cameras"

    camera_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location_code: Mapped[str] = mapped_column(String(50), nullable=False)
    stream_url: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="online")  # online, offline, degraded
    configuration: Mapped[dict] = mapped_column(JSON, default=dict)


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    frame_ts: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    camera_id: Mapped[str] = mapped_column(String(50), ForeignKey("cameras.camera_id"), index=True)
    object_type: Mapped[str] = mapped_column(String(30), index=True)  # person, vehicle, face
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bbox: Mapped[list] = mapped_column(JSON, nullable=False)  # [x1, y1, x2, y2]
    track_id: Mapped[str] = mapped_column(String(50), index=True)


class Track(Base):
    __tablename__ = "tracks"

    track_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    camera_id: Mapped[str] = mapped_column(String(50), ForeignKey("cameras.camera_id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    trajectory_summary: Mapped[dict] = mapped_column(JSON, default=dict)
    object_class: Mapped[str] = mapped_column(String(30))


class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"ALT-{uuid.uuid4().hex[:8].upper()}")
    event_id: Mapped[str] = mapped_column(String(50), index=True)
    severity: Mapped[str] = mapped_column(String(20), index=True)  # low, medium, high
    rule: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)  # new, acknowledged, resolved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_by: Mapped[str] = mapped_column(String(50), nullable=True)
    evidence_ref: Mapped[str] = mapped_column(String(255), nullable=True)


class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"EVD-{uuid.uuid4().hex[:8].upper()}")
    event_id: Mapped[str] = mapped_column(String(50), index=True)
    snapshot_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    retention_metadata: Mapped[dict] = mapped_column(JSON, default=dict)


class Zone(Base):
    __tablename__ = "zones"

    zone_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"ZONE-{uuid.uuid4().hex[:6].upper()}")
    camera_id: Mapped[str] = mapped_column(String(50), ForeignKey("cameras.camera_id"), index=True)
    name: Mapped[str] = mapped_column(String(100), default="Restricted Zone")
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)  # polygon/line coordinates
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)  # virtual_fence, dwell, intrusion
    threshold: Mapped[dict] = mapped_column(JSON, default=dict)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    object: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    result: Mapped[str] = mapped_column(String(20), default="SUCCESS")
    source: Mapped[str] = mapped_column(String(50), default="backend-api")

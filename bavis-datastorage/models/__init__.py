"""
BAVIS — SQLAlchemy ORM Models
Workstream D: Data, Storage & Event Schema

This file is the single source of truth for the database schema.
All other workstreams (Backend, AI/CV, Intelligence, Frontend) are coding
against these shapes.  Do NOT rename or drop fields without team announcement.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid


# ─── Base ─────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Enums ────────────────────────────────────────────────────────────────────

class CameraStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"


class ObjectType(str, enum.Enum):
    person = "person"
    vehicle = "vehicle"
    face = "face"
    unknown = "unknown"


class AlertSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class AlertStatus(str, enum.Enum):
    new = "new"
    acknowledged = "acknowledged"
    resolved = "resolved"


class ZoneRuleType(str, enum.Enum):
    virtual_fence = "virtual_fence"
    restricted_area = "restricted_area"
    dwell_time = "dwell_time"
    headcount = "headcount"


class AuditAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    alert_ack = "alert_ack"
    alert_resolve = "alert_resolve"
    zone_create = "zone_create"
    zone_update = "zone_update"
    zone_delete = "zone_delete"
    evidence_access = "evidence_access"
    camera_add = "camera_add"
    camera_update = "camera_update"
    seed_reset = "seed_reset"


# ─── Camera ───────────────────────────────────────────────────────────────────

class Camera(Base):
    """
    Represents an IP/RTSP camera in the BAVIS network.

    API contract field: camera_id, name, location_code, stream_url, status, configuration
    """
    __tablename__ = "cameras"

    camera_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: str = Column(String(128), nullable=False)
    location_code: str = Column(String(64), nullable=False, index=True)
    stream_url: str = Column(String(512), nullable=True)    # null for offline/demo cameras
    status: str = Column(
        Enum(CameraStatus, name="camera_status_enum"),
        nullable=False,
        default=CameraStatus.active,
    )
    # JSON blob for camera-specific config: fps, resolution, night_mode, etc.
    configuration: dict = Column(JSON, nullable=True, default=dict)
    created_at: datetime = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: datetime = Column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    detections = relationship("Detection", back_populates="camera", cascade="all, delete-orphan")
    tracks = relationship("Track", back_populates="camera", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")
    zones = relationship("Zone", back_populates="camera", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Camera {self.name!r} [{self.location_code}] status={self.status}>"


# ─── Track ────────────────────────────────────────────────────────────────────

class Track(Base):
    """
    A multi-frame object track assigned by the tracker (ByteTrack / BoT-SORT).
    A Detection belongs to a Track.  One Track spans many Detections.

    API contract fields: track_id, camera_id, start_time, end_time,
                         trajectory_summary, object_class
    """
    __tablename__ = "tracks"

    track_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    camera_id: str = Column(
        UUID(as_uuid=False), ForeignKey("cameras.camera_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    object_class: str = Column(
        Enum(ObjectType, name="object_type_enum"), nullable=False
    )
    start_time: datetime = Column(DateTime(timezone=True), nullable=False)
    end_time: datetime = Column(DateTime(timezone=True), nullable=True)  # null = ongoing

    # Compact summary of the track path: list of [x_center, y_center] normalised coords
    # e.g. [[0.1,0.9],[0.15,0.85], ...]  — stored as JSON to avoid a separate table
    trajectory_summary: list = Column(JSON, nullable=True, default=list)

    # Total number of frames in this track
    frame_count: int = Column(Integer, nullable=False, default=0)

    created_at: datetime = Column(DateTime(timezone=True), nullable=False, default=_now)

    # Relationships
    camera = relationship("Camera", back_populates="tracks")
    detections = relationship("Detection", back_populates="track", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Track {self.track_id[:8]} cam={self.camera_id[:8]} class={self.object_class}>"


# ─── Detection ────────────────────────────────────────────────────────────────

class Detection(Base):
    """
    A single detection event from the AI/CV engine for one frame.
    Implements the Shared Contract 8.1 shape exactly.

    API contract fields: camera_id, frame_ts, object_type, confidence, bbox, track_id
    """
    __tablename__ = "detections"

    detection_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    camera_id: str = Column(
        UUID(as_uuid=False), ForeignKey("cameras.camera_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    track_id: str = Column(
        UUID(as_uuid=False), ForeignKey("tracks.track_id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    # ISO-8601 timestamp of the source video frame
    frame_ts: datetime = Column(DateTime(timezone=True), nullable=False, index=True)

    object_type: str = Column(
        Enum(ObjectType, name="object_type_enum"),
        nullable=False,
    )
    confidence: float = Column(Float, nullable=False)

    # Bounding box: [x1, y1, x2, y2] in pixel coordinates
    bbox: list = Column(JSON, nullable=False)  # [x1, y1, x2, y2]

    # Relationships
    camera = relationship("Camera", back_populates="detections")
    track = relationship("Track", back_populates="detections")

    def __repr__(self) -> str:
        return (
            f"<Detection {self.detection_id[:8]} "
            f"type={self.object_type} conf={self.confidence:.2f}>"
        )


# ─── Alert ────────────────────────────────────────────────────────────────────

class Alert(Base):
    """
    A prioritized security event generated by the Intelligence / Event Engine.
    Implements the Shared Contract 8.2 shape exactly.

    API contract fields: alert_id, event_id, severity, rule, status,
                         created_at, acknowledged_by, evidence_ref
    """
    __tablename__ = "alerts"

    alert_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # event_id ties back to the triggering detection or a logical event grouping
    event_id: str = Column(
        UUID(as_uuid=False), ForeignKey("detections.detection_id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    camera_id: str = Column(
        UUID(as_uuid=False), ForeignKey("cameras.camera_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    # Rule that triggered the alert (e.g. "virtual_fence_breach", "dwell_time_exceeded")
    rule: str = Column(String(128), nullable=False)

    severity: str = Column(
        Enum(AlertSeverity, name="alert_severity_enum"),
        nullable=False,
        default=AlertSeverity.medium,
    )
    status: str = Column(
        Enum(AlertStatus, name="alert_status_enum"),
        nullable=False,
        default=AlertStatus.new,
        index=True,
    )
    # Optional human-readable description of the alert
    description: str = Column(Text, nullable=True)

    # Reference to the evidence snapshot/clip stored in MinIO
    evidence_ref: str = Column(String(512), nullable=True)

    created_at: datetime = Column(DateTime(timezone=True), nullable=False, default=_now, index=True)
    updated_at: datetime = Column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    acknowledged_by: str = Column(String(128), nullable=True)   # user_id or username
    acknowledged_at: datetime = Column(DateTime(timezone=True), nullable=True)
    resolved_at: datetime = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    camera = relationship("Camera", back_populates="alerts")
    evidence = relationship("Evidence", back_populates="alert", uselist=False)

    def __repr__(self) -> str:
        return (
            f"<Alert {self.alert_id[:8]} rule={self.rule!r} "
            f"severity={self.severity} status={self.status}>"
        )


# ─── Evidence ─────────────────────────────────────────────────────────────────

class Evidence(Base):
    """
    Snapshot or video clip stored in MinIO / S3-compatible storage.
    The database stores the reference path — binary is never stored in Postgres.

    API contract fields: evidence_id, event_id, snapshot_ref, retention_metadata
    """
    __tablename__ = "evidence"

    evidence_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # event_id = alert_id in this implementation (one evidence per alert)
    event_id: str = Column(
        UUID(as_uuid=False), ForeignKey("alerts.alert_id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    # Path inside the MinIO bucket, e.g. cameras/<id>/snapshots/2026-09-02/<evid>.jpg
    snapshot_ref: str = Column(String(512), nullable=True)
    clip_ref: str = Column(String(512), nullable=True)  # MP4 clip, if captured

    # Retention: {"retain_until": "ISO-8601", "reason": "string", "purged": false}
    retention_metadata: dict = Column(JSON, nullable=True, default=dict)

    captured_at: datetime = Column(DateTime(timezone=True), nullable=False, default=_now)

    # Relationships
    alert = relationship("Alert", back_populates="evidence")

    def __repr__(self) -> str:
        return f"<Evidence {self.evidence_id[:8]} snap={self.snapshot_ref!r}>"


# ─── Zone ─────────────────────────────────────────────────────────────────────

class Zone(Base):
    """
    A virtual fence, restricted area or counting zone drawn on a camera view.
    Geometry is stored as a GeoJSON-compatible JSON structure.

    API contract fields: zone_id, camera_id, geometry (polygon/line),
                         rule_type, threshold
    """
    __tablename__ = "zones"

    zone_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    camera_id: str = Column(
        UUID(as_uuid=False), ForeignKey("cameras.camera_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    name: str = Column(String(128), nullable=False)

    rule_type: str = Column(
        Enum(ZoneRuleType, name="zone_rule_type_enum"),
        nullable=False,
        default=ZoneRuleType.virtual_fence,
    )

    # Geometry: GeoJSON-style polygon or line, e.g.
    # {"type": "Polygon", "coordinates": [[[x,y], ...]]}
    # Coordinates are normalized (0.0–1.0) relative to frame dimensions.
    geometry: dict = Column(JSON, nullable=False)

    # threshold meaning depends on rule_type:
    #   virtual_fence: number of crossings before alert
    #   dwell_time: seconds
    #   headcount: max person count
    threshold: float = Column(Float, nullable=True)

    is_active: bool = Column(Boolean, nullable=False, default=True)

    created_at: datetime = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: datetime = Column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    camera = relationship("Camera", back_populates="zones")

    def __repr__(self) -> str:
        return (
            f"<Zone {self.zone_id[:8]} name={self.name!r} "
            f"rule={self.rule_type} cam={self.camera_id[:8]}>"
        )


# ─── AuditLog ─────────────────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Immutable record of security-relevant operator or system actions.
    Written once; never updated or deleted through normal application paths.

    API contract fields: actor, action, object, timestamp, result, source
    """
    __tablename__ = "audit_log"

    log_id: str = Column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    actor: str = Column(String(128), nullable=False, index=True)   # user_id / "system"
    action: str = Column(
        Enum(AuditAction, name="audit_action_enum"),
        nullable=False,
        index=True,
    )
    # object: free-form reference to the thing being acted on (alert_id, zone_id, etc.)
    object_ref: str = Column(String(512), nullable=True)
    object_type: str = Column(String(64), nullable=True)  # "alert", "zone", "evidence" …

    result: str = Column(String(32), nullable=False, default="success")  # success | failure
    detail: dict = Column(JSON, nullable=True)  # extra context (IP, reason, old/new values)
    source: str = Column(String(128), nullable=True)  # client IP or service name

    timestamp: datetime = Column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog {self.log_id[:8]} actor={self.actor!r} "
            f"action={self.action} result={self.result}>"
        )

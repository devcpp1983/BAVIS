"""
Shared data contracts and schemas for BAVIS Intelligence Engine.
Complies exactly with Section 8 of BAVIS architecture spec.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Tuple, Optional, Dict, Any
import uuid


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RuleType(str, Enum):
    VIRTUAL_FENCE_BREACH = "virtual_fence_breach"
    ZONE_INTRUSION = "zone_intrusion"
    DWELL_TIME_EXCEEDED = "dwell_time_exceeded"
    UNUSUAL_TIME_MOVEMENT = "unusual_time_movement"


@dataclass
class DetectionEvent:
    """Raw object detection input from AI/CV Engine (Section 8.1)."""
    camera_id: str
    frame_ts: str  # ISO-8601 string
    object_type: str  # 'person' | 'vehicle' | 'face'
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    track_id: str

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DetectionEvent":
        return cls(
            camera_id=d["camera_id"],
            frame_ts=d["frame_ts"],
            object_type=d["object_type"],
            confidence=float(d["confidence"]),
            bbox=[float(x) for x in d["bbox"]],
            track_id=str(d["track_id"]),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "camera_id": self.camera_id,
            "frame_ts": self.frame_ts,
            "object_type": self.object_type,
            "confidence": self.confidence,
            "bbox": self.bbox,
            "track_id": self.track_id,
        }

    @property
    def timestamp_dt(self) -> datetime:
        """Parse frame_ts into UTC datetime object."""
        try:
            # Replace Z with +00:00 for datetime.fromisoformat compatibility in Python <=3.10
            ts_str = self.frame_ts.replace("Z", "+00:00")
            return datetime.fromisoformat(ts_str)
        except Exception:
            return datetime.now(timezone.utc)

    @property
    def bottom_center(self) -> Tuple[float, float]:
        """Calculates bottom center coordinate of bounding box [x1, y1, x2, y2]."""
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2.0, y2)

    @property
    def center(self) -> Tuple[float, float]:
        """Calculates center coordinate of bounding box."""
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


@dataclass
class ZoneConfig:
    """Zone configuration created via dashboard / stored in DB."""
    zone_id: str
    camera_id: str
    name: str
    geometry_type: str  # 'polygon' | 'line'
    coordinates: List[Tuple[float, float]]  # List of [x, y] points
    rule_type: str = RuleType.ZONE_INTRUSION.value
    sensitivity: float = 1.0  # Multiplier 0.1 to 2.0
    allowed_object_types: List[str] = field(default_factory=list)  # Empty means all restricted
    dwell_threshold_seconds: float = 5.0
    restricted_hours_start: Optional[int] = 22  # e.g., 22 (10 PM)
    restricted_hours_end: Optional[int] = 6  # e.g., 6 (6 AM)

    def is_hours_restricted(self, dt: datetime) -> bool:
        """Checks if given datetime falls within restricted hours window."""
        if self.restricted_hours_start is None or self.restricted_hours_end is None:
            return False
        hour = dt.hour
        start, end = self.restricted_hours_start, self.restricted_hours_end
        if start <= end:
            return start <= hour < end
        else:
            # Overnight window (e.g. 22:00 to 06:00)
            return hour >= start or hour < end


@dataclass
class AlertEvent:
    """Output Alert/Event record matching Section 8.2 contract."""
    alert_id: str
    event_id: str
    severity: str  # 'low' | 'medium' | 'high'
    rule: str
    status: str = "new"  # 'new' | 'acknowledged' | 'resolved'
    created_at: str = ""  # ISO-8601 timestamp
    acknowledged_by: Optional[str] = None
    evidence_ref: Optional[str] = None
    camera_id: str = ""
    track_id: str = ""
    score: float = 0.0
    explanation: str = ""

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if not self.alert_id:
            self.alert_id = f"alt_{uuid.uuid4().hex[:8]}"
        if not self.event_id:
            self.event_id = f"evt_{uuid.uuid4().hex[:8]}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_id": self.alert_id,
            "event_id": self.event_id,
            "severity": self.severity,
            "rule": self.rule,
            "status": self.status,
            "created_at": self.created_at,
            "acknowledged_by": self.acknowledged_by,
            "evidence_ref": self.evidence_ref,
            "camera_id": self.camera_id,
            "track_id": self.track_id,
            "score": round(self.score, 3),
            "explanation": self.explanation,
        }

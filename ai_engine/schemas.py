"""
BAVIS AI / CV Data Schemas & API Contract
Implements Section 8.1 Shared Contract for SIH26187
"""

from typing import Optional, Literal, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class DetectionEvent(BaseModel):
    """
    Standard detection contract (Section 8.1).
    Consumed directly by Intelligence Engine (Workstream E) and Backend Gateway (Workstream B).
    """
    camera_id: str = Field(..., description="Camera identifier")
    frame_ts: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 timestamp of the frame"
    )
    object_type: Literal["person", "vehicle", "face"] = Field(
        ..., 
        description="Detected object classification"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0 - 1.0]")
    bbox: list[float] = Field(
        ..., 
        min_length=4, 
        max_length=4, 
        description="Bounding box [x1, y1, x2, y2] in pixel coordinates"
    )
    track_id: str = Field(..., description="Stable multi-object tracking ID")
    
    # Optional extended attributes (e.g. for ANPR plate text, sub-classes)
    attributes: Optional[dict[str, Any]] = Field(
        default=None, 
        description="Additional intelligence attributes (plate_text, vehicle_subclass, etc.)"
    )


class InferRequest(BaseModel):
    """
    Request model for POST /infer
    """
    camera_id: str = Field(..., description="Camera ID producing the frame")
    frame_base64: str = Field(..., description="Base64-encoded JPEG/PNG image")
    frame_ts: Optional[str] = Field(
        default=None,
        description="Optional frame capture timestamp (ISO-8601). Defaults to current UTC."
    )
    enable_face_detection: bool = Field(
        default=True, 
        description="Enable face bounding-box detection"
    )
    enable_anpr: bool = Field(
        default=True, 
        description="Enable license plate detection and OCR extraction"
    )
    force_low_light_mode: Optional[bool] = Field(
        default=None, 
        description="Force low-light enhancement (None for auto-detection)"
    )


class InferResponse(BaseModel):
    """
    Response model for POST /infer
    """
    camera_id: str
    frame_ts: str
    detections: list[DetectionEvent]
    total_detections: int
    inference_ms: float
    fps: float
    low_light_enhanced: bool
    frame_dimensions: list[int] = Field(
        ..., 
        min_length=2, 
        max_length=2, 
        description="[width, height] of processed frame"
    )


class HealthResponse(BaseModel):
    status: str
    service: str = "bavis-ai-engine"
    version: str = "1.0.0"
    device: str
    gpu_available: bool
    gpu_device_name: Optional[str] = None
    loaded_models: dict[str, bool]


class CameraMetric(BaseModel):
    total_frames: int = 0
    total_detections: int = 0
    avg_latency_ms: float = 0.0
    last_frame_ts: Optional[str] = None


class MetricsResponse(BaseModel):
    uptime_seconds: float
    total_frames_processed: int
    overall_fps: float
    avg_latency_ms: float
    cameras: dict[str, CameraMetric]

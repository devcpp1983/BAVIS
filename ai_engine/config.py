"""
BAVIS AI / CV Engine Configuration
"""

import os
from pydantic import BaseModel, Field

def _detect_device() -> str:
    forced = os.getenv("BAVIS_DEVICE")
    if forced:
        return forced
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"

class InferenceConfig(BaseModel):
    # Device Configuration
    device: str = _detect_device()
    
    # Model Weights
    yolo_model_path: str = os.getenv("BAVIS_YOLO_MODEL", "yolov8n.pt")
    
    # Confidence Thresholds
    person_conf: float = float(os.getenv("BAVIS_PERSON_CONF", "0.35"))
    vehicle_conf: float = float(os.getenv("BAVIS_VEHICLE_CONF", "0.35"))
    face_conf: float = float(os.getenv("BAVIS_FACE_CONF", "0.40"))
    plate_conf: float = float(os.getenv("BAVIS_PLATE_CONF", "0.30"))
    
    # Class IDs for YOLO (COCO dataset standard)
    # 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
    target_classes: list[int] = [0, 1, 2, 3, 5, 7]
    
    # Tracker Settings (ByteTrack)
    track_thresh: float = 0.25
    track_buffer: int = 30
    match_thresh: float = 0.8
    
    # Low-light Enhancement
    low_light_auto_detect: bool = True
    low_light_brightness_thresh: float = 65.0  # Mean grayscale brightness threshold (0-255)
    clahe_clip_limit: float = 3.0
    clahe_tile_grid_size: tuple[int, int] = (8, 8)
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))


config = InferenceConfig()

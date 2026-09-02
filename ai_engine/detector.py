"""
BAVIS AI / CV - Object Detector Module
Person & Vehicle detection utilizing Ultralytics YOLO with CUDA acceleration
"""

import logging
from typing import Literal
import numpy as np
import cv2

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

from ai_engine.config import config

logger = logging.getLogger("bavis.detector")


class ObjectDetector:
    """
    Handles detection of target surveillance entities: person and vehicle.
    """

    # COCO Class Mapping
    CLASS_MAP = {
        0: ("person", "person"),
        1: ("vehicle", "bicycle"),
        2: ("vehicle", "car"),
        3: ("vehicle", "motorcycle"),
        5: ("vehicle", "bus"),
        7: ("vehicle", "truck")
    }

    def __init__(
        self, 
        model_path: str = config.yolo_model_path,
        device: str = config.device
    ):
        self.model_path = model_path
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load pretrained YOLO detector model."""
        if not ULTRALYTICS_AVAILABLE:
            logger.warning("Ultralytics YOLO not installed. Detector will run in fallback mock mode.")
            return

        try:
            logger.info(f"Loading YOLO model from {self.model_path} on device={self.device}...")
            self.model = YOLO(self.model_path)
            # Warm up model if device is available
            dummy = np.zeros((320, 320, 3), dtype=np.uint8)
            self.model(dummy, verbose=False, device=self.device)
            logger.info("YOLO model initialized and warmed up successfully.")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}. Falling back to CPU.")
            try:
                self.device = "cpu"
                self.model = YOLO(self.model_path)
            except Exception as ex:
                logger.error(f"Critical error loading model: {ex}")
                self.model = None

    def detect(self, frame_bgr: np.ndarray) -> list[dict]:
        """
        Run inference on a single frame.
        
        Returns:
            list of dicts: [
                {
                    "object_type": "person" | "vehicle",
                    "sub_class": str,
                    "confidence": float,
                    "bbox": [x1, y1, x2, y2],
                    "class_id": int
                }, ...
            ]
        """
        if self.model is None:
            return []

        # Run inference
        results = self.model(
            frame_bgr, 
            classes=config.target_classes,
            device=self.device,
            verbose=False
        )

        detections = []
        if not results:
            return detections

        res = results[0]
        boxes = res.boxes

        if boxes is None or len(boxes) == 0:
            return detections

        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy().astype(int)

        for box, conf, cls_id in zip(xyxy, confs, classes):
            if cls_id in self.CLASS_MAP:
                obj_type, sub_class = self.CLASS_MAP[cls_id]
                
                # Check category-specific thresholds
                thresh = config.person_conf if obj_type == "person" else config.vehicle_conf
                if conf < thresh:
                    continue

                x1, y1, x2, y2 = [float(round(coord, 2)) for coord in box]
                detections.append({
                    "object_type": obj_type,
                    "sub_class": sub_class,
                    "confidence": float(round(conf, 4)),
                    "bbox": [x1, y1, x2, y2],
                    "class_id": int(cls_id)
                })

        return detections

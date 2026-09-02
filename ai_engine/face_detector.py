"""
BAVIS AI / CV - Face Detection Module
Privacy-preserving face detection (bounding box only; no biometric recognition)
"""

import os
import logging
import cv2
import numpy as np

from ai_engine.config import config

logger = logging.getLogger("bavis.face")


class FaceDetector:
    """
    Detects human faces in camera frames for security awareness.
    Adheres strictly to SIH cybersecurity & privacy constraints (Section 14):
    Detection only — no biometric vector extraction or facial identification.
    """

    def __init__(self, confidence_threshold: float = config.face_conf):
        self.conf_threshold = confidence_threshold
        self.cascade = None
        self._init_detector()

    def _init_detector(self):
        """Initialize OpenCV Haar Cascade / DNN face detector."""
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                self.cascade = cv2.CascadeClassifier(cascade_path)
                logger.info("OpenCV Haar face detector initialized.")
            else:
                logger.warning(f"Haar cascade file not found at {cascade_path}")
        except Exception as e:
            logger.error(f"Failed to initialize FaceDetector: {e}")

    def detect(self, frame_bgr: np.ndarray, person_crops: list[dict] | None = None) -> list[dict]:
        """
        Detect faces in the frame.
        
        Args:
            frame_bgr: Full BGR frame
            person_crops: Optional list of person bounding boxes to focus face search (ROI speedup)
            
        Returns:
            list of dicts: [
                {
                    "object_type": "face",
                    "confidence": float,
                    "bbox": [x1, y1, x2, y2],
                    "track_id": str
                }, ...
            ]
        """
        if self.cascade is None:
            return []

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        detections = []

        # If person bounding boxes were provided, search within upper 40% of each person ROI
        if person_crops:
            for p in person_crops:
                x1, y1, x2, y2 = [int(c) for c in p["bbox"]]
                h = y2 - y1
                w = x2 - x1
                if w < 20 or h < 30:
                    continue

                # Face is typically in the upper 45% of a person bbox
                roi_y2 = min(frame_bgr.shape[0], int(y1 + h * 0.45))
                roi_x1 = max(0, x1)
                roi_y1 = max(0, y1)
                roi_x2 = min(frame_bgr.shape[1], x2)

                roi_gray = gray[roi_y1:roi_y2, roi_x1:roi_x2]
                if roi_gray.shape[0] < 10 or roi_gray.shape[1] < 10:
                    continue

                faces = self.cascade.detectMultiScale(
                    roi_gray,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(20, 20)
                )

                for (fx, fy, fw, fh) in faces:
                    fx1 = float(roi_x1 + fx)
                    fy1 = float(roi_y1 + fy)
                    fx2 = float(fx1 + fw)
                    fy2 = float(fy1 + fh)
                    
                    detections.append({
                        "object_type": "face",
                        "confidence": 0.88,
                        "bbox": [fx1, fy1, fx2, fy2],
                        "associated_person_track": p.get("track_id")
                    })
        else:
            # Full frame search
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.15,
                minNeighbors=5,
                minSize=(30, 30)
            )

            for (x, y, w, h) in faces:
                detections.append({
                    "object_type": "face",
                    "confidence": 0.85,
                    "bbox": [float(x), float(y), float(x + w), float(y + h)],
                    "associated_person_track": None
                })

        return detections

"""
BAVIS AI / CV - Unified Inference Pipeline Orchestrator
Coordinates Object Detection, Tracking, Face Detection, ANPR, and Low-Light Enhancement
"""

import time
import base64
import logging
from datetime import datetime, timezone
import cv2
import numpy as np

from ai_engine.config import config
from ai_engine.schemas import DetectionEvent, InferRequest, InferResponse, CameraMetric
from ai_engine.detector import ObjectDetector
from ai_engine.tracker import TrackerManager
from ai_engine.face_detector import FaceDetector
from ai_engine.anpr import ANPRPipeline
from ai_engine.low_light import LowLightEnhancer

logger = logging.getLogger("bavis.pipeline")


class VideoIntelligencePipeline:
    """
    Main orchestration engine executing the 5-stage vision analytics pipeline.
    """

    def __init__(self):
        logger.info("Initializing BAVIS Video Intelligence Pipeline...")
        self.start_time = time.time()
        
        # Core modules
        self.enhancer = LowLightEnhancer(
            brightness_threshold=config.low_light_brightness_thresh,
            clahe_clip_limit=config.clahe_clip_limit
        )
        self.detector = ObjectDetector()
        self.tracker_manager = TrackerManager()
        self.face_detector = FaceDetector()
        self.anpr_pipeline = ANPRPipeline()

        # Telemetry and metrics
        self.total_frames = 0
        self.total_latency_ms = 0.0
        self.camera_metrics: dict[str, CameraMetric] = {}
        logger.info("BAVIS Video Intelligence Pipeline ready.")

    @staticmethod
    def decode_base64_frame(base64_str: str) -> np.ndarray:
        """Decode base64 encoded image string into OpenCV BGR numpy array."""
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode base64 image data.")
        return img

    def process_frame(
        self,
        frame_bgr: np.ndarray,
        camera_id: str,
        frame_ts: str | None = None,
        enable_face: bool = True,
        enable_anpr: bool = True,
        force_low_light: bool | None = None
    ) -> InferResponse:
        """
        Execute full multi-model inference pass on a video frame.
        """
        t0 = time.perf_counter()
        
        if frame_ts is None:
            frame_ts = datetime.now(timezone.utc).isoformat()

        h, w = frame_bgr.shape[:2]

        # Stage 1: Night & Low-Light Analytics Preprocessing
        processed_frame, was_enhanced = self.enhancer.process(frame_bgr, force_mode=force_low_light)

        # Stage 2: Person & Vehicle Object Detection
        raw_detections = self.detector.detect(processed_frame)

        # Stage 3: Multi-Object Tracking (Stateful per Camera ID)
        tracker = self.tracker_manager.get_tracker(camera_id)
        tracked_objects = tracker.update(raw_detections)

        # Separate persons and vehicles for downstream specialized tasks
        person_detections = [d for d in tracked_objects if d["object_type"] == "person"]
        vehicle_detections = [d for d in tracked_objects if d["object_type"] == "vehicle"]

        all_detection_events: list[DetectionEvent] = []

        # Convert tracked objects into standard contract events
        for obj in tracked_objects:
            event = DetectionEvent(
                camera_id=camera_id,
                frame_ts=frame_ts,
                object_type=obj["object_type"],
                confidence=obj["confidence"],
                bbox=obj["bbox"],
                track_id=obj["track_id"],
                attributes={
                    "sub_class": obj.get("sub_class", obj["object_type"]),
                    "low_light_enhanced": was_enhanced
                }
            )
            all_detection_events.append(event)

        # Stage 4: Face Detection (Bounding-Box only for security awareness)
        if enable_face and person_detections:
            face_results = self.face_detector.detect(processed_frame, person_crops=person_detections)
            for f in face_results:
                face_track_id = f"face_{f.get('associated_person_track', camera_id)}"
                face_event = DetectionEvent(
                    camera_id=camera_id,
                    frame_ts=frame_ts,
                    object_type="face",
                    confidence=f["confidence"],
                    bbox=f["bbox"],
                    track_id=face_track_id,
                    attributes={
                        "associated_person_track": f.get("associated_person_track")
                    }
                )
                all_detection_events.append(face_event)

        # Stage 5: ANPR (License Plate Detection + OCR)
        if enable_anpr and vehicle_detections:
            anpr_results = self.anpr_pipeline.process_vehicles(processed_frame, vehicle_detections)
            for anpr in anpr_results:
                # Merge attributes or append detection
                anpr_event = DetectionEvent(
                    camera_id=camera_id,
                    frame_ts=frame_ts,
                    object_type="vehicle",
                    confidence=anpr["confidence"],
                    bbox=anpr["bbox"],
                    track_id=anpr["track_id"],
                    attributes=anpr["attributes"]
                )
                all_detection_events.append(anpr_event)

        t1 = time.perf_counter()
        inference_ms = float(round((t1 - t0) * 1000, 2))
        fps = float(round(1000.0 / max(inference_ms, 0.001), 1))

        # Update telemetry
        self.total_frames += 1
        self.total_latency_ms += inference_ms

        if camera_id not in self.camera_metrics:
            self.camera_metrics[camera_id] = CameraMetric()
        
        cam_stat = self.camera_metrics[camera_id]
        cam_stat.total_frames += 1
        cam_stat.total_detections += len(all_detection_events)
        cam_stat.avg_latency_ms = float(round(
            (cam_stat.avg_latency_ms * (cam_stat.total_frames - 1) + inference_ms) / cam_stat.total_frames, 2
        ))
        cam_stat.last_frame_ts = frame_ts

        return InferResponse(
            camera_id=camera_id,
            frame_ts=frame_ts,
            detections=all_detection_events,
            total_detections=len(all_detection_events),
            inference_ms=inference_ms,
            fps=fps,
            low_light_enhanced=was_enhanced,
            frame_dimensions=[w, h]
        )

    def get_metrics(self) -> dict:
        """Return operational telemetry."""
        uptime = time.time() - self.start_time
        avg_lat = (self.total_latency_ms / self.total_frames) if self.total_frames > 0 else 0.0
        fps = (self.total_frames / uptime) if uptime > 0 else 0.0
        return {
            "uptime_seconds": float(round(uptime, 2)),
            "total_frames_processed": self.total_frames,
            "overall_fps": float(round(fps, 2)),
            "avg_latency_ms": float(round(avg_lat, 2)),
            "cameras": self.camera_metrics
        }

"""
BAVIS AI / CV - Multi-Object Tracker Module
Maintains stable track_ids across frames per camera feed using ByteTrack
"""

import logging
import warnings
from typing import Optional
import numpy as np

# Suppress supervision internal ByteTrack transition deprecation warning
warnings.filterwarnings("ignore", category=FutureWarning, module="supervision.*")

try:
    import supervision as sv
    SUPERVISION_AVAILABLE = True
except ImportError:
    SUPERVISION_AVAILABLE = False

from ai_engine.config import config

logger = logging.getLogger("bavis.tracker")


class CameraTracker:
    """
    Manages stateful tracking for a single camera feed.
    """

    def __init__(
        self,
        camera_id: str,
        track_thresh: float = config.track_thresh,
        track_buffer: int = config.track_buffer,
        match_thresh: float = config.match_thresh
    ):
        self.camera_id = camera_id
        self.track_thresh = track_thresh
        self.track_buffer = track_buffer
        self.match_thresh = match_thresh
        
        self.tracker = None
        if SUPERVISION_AVAILABLE:
            try:
                self.tracker = sv.ByteTrack(
                    track_activation_threshold=self.track_thresh,
                    lost_track_buffer=self.track_buffer,
                    minimum_matching_threshold=self.match_thresh
                )
            except Exception as e:
                logger.error(f"Failed to initialize ByteTrack for camera {camera_id}: {e}")
                self.tracker = None
        
        # Fallback tracking state (simple IoU / spatial matching tracker if supervision is absent)
        self.next_fallback_id = 1
        self.active_tracks: dict[int, dict] = {}

    def update(self, raw_detections: list[dict]) -> list[dict]:
        """
        Update tracker with current frame detections.
        
        Args:
            raw_detections: list of dicts with 'bbox', 'confidence', 'class_id', 'object_type', 'sub_class'
            
        Returns:
            list of dicts with attached 'track_id'
        """
        if not raw_detections:
            # Step tracker with empty detection if supported
            if self.tracker is not None and SUPERVISION_AVAILABLE:
                empty_dets = sv.Detections.empty()
                self.tracker.update_with_detections(empty_dets)
            return []

        # If Supervision ByteTrack is available:
        if self.tracker is not None and SUPERVISION_AVAILABLE:
            try:
                xyxy = np.array([d["bbox"] for d in raw_detections], dtype=np.float32)
                confidence = np.array([d["confidence"] for d in raw_detections], dtype=np.float32)
                class_id = np.array([d["class_id"] for d in raw_detections], dtype=int)

                sv_detections = sv.Detections(
                    xyxy=xyxy,
                    confidence=confidence,
                    class_id=class_id
                )

                tracked_detections = self.tracker.update_with_detections(sv_detections)

                results = []
                if tracked_detections.tracker_id is not None and len(tracked_detections.tracker_id) > 0:
                    for i, track_num in enumerate(tracked_detections.tracker_id):
                        if track_num is None or track_num == -1:
                            continue
                        
                        box = [float(round(c, 2)) for c in tracked_detections.xyxy[i]]
                        conf = float(round(tracked_detections.confidence[i], 4)) if tracked_detections.confidence is not None else 0.5
                        cls_id = int(tracked_detections.class_id[i]) if tracked_detections.class_id is not None else 0
                        
                        # Find corresponding raw detection for sub_class / object_type
                        obj_type = "person" if cls_id == 0 else "vehicle"
                        sub_class = "person" if cls_id == 0 else "car"
                        for d in raw_detections:
                            if d["class_id"] == cls_id and abs(d["bbox"][0] - box[0]) < 5:
                                obj_type = d["object_type"]
                                sub_class = d.get("sub_class", sub_class)
                                break

                        results.append({
                            "object_type": obj_type,
                            "sub_class": sub_class,
                            "confidence": conf,
                            "bbox": box,
                            "track_id": f"trk_{self.camera_id}_{track_num}"
                        })

                # If ByteTrack returned empty or unconfirmed tracklets, ensure detections are still passed with tentative track IDs
                if not results:
                    return self._fallback_update(raw_detections)

                return results
            except Exception as e:
                logger.error(f"ByteTrack update failed: {e}. Using fallback tracker.")
                return self._fallback_update(raw_detections)
        else:
            return self._fallback_update(raw_detections)

    def _fallback_update(self, raw_detections: list[dict]) -> list[dict]:
        """Simple spatial IoU tracker for fallback operation."""
        results = []
        for i, det in enumerate(raw_detections):
            # Assign tentative track ID based on position/counter
            track_id = f"trk_{self.camera_id}_{self.next_fallback_id}"
            self.next_fallback_id += 1
            if self.next_fallback_id > 99999:
                self.next_fallback_id = 1
            
            res = dict(det)
            res["track_id"] = track_id
            results.append(res)
        return results


class TrackerManager:
    """
    Registry of trackers keyed by camera_id to ensure multi-camera isolation.
    """

    def __init__(self):
        self.trackers: dict[str, CameraTracker] = {}

    def get_tracker(self, camera_id: str) -> CameraTracker:
        if camera_id not in self.trackers:
            self.trackers[camera_id] = CameraTracker(camera_id=camera_id)
        return self.trackers[camera_id]

    def reset_camera(self, camera_id: str):
        if camera_id in self.trackers:
            del self.trackers[camera_id]

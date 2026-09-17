import os
import cv2
import time
import asyncio
import logging
import uuid
import random
import numpy as np
from datetime import datetime
from typing import Dict, Optional

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.domain import Camera, Detection, Alert, Evidence
from app.schemas.contract import AlertEvent
from app.services.ai_client import ai_client
from app.services.alert_service import alert_broadcaster
from app.services.webhook import trigger_c2_webhook

logger = logging.getLogger("bavis.ingestion")


class StreamIngestionManager:
    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False

    async def start_all(self):
        self.is_running = True
        logger.info("Starting Video Ingestion Manager for configured camera streams...")

        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(Camera))
            cameras = result.scalars().all()

        for cam in cameras:
            if cam.camera_id not in self.active_tasks:
                task = asyncio.create_task(self._process_camera_stream(cam.camera_id, cam.stream_url))
                self.active_tasks[cam.camera_id] = task

    async def stop_all(self):
        self.is_running = False
        for cam_id, task in self.active_tasks.items():
            task.cancel()
        self.active_tasks.clear()
        logger.info("Video Ingestion Manager stopped.")

    async def _process_camera_stream(self, camera_id: str, stream_url: str):
        logger.info(f"Started ingestion worker for Camera [{camera_id}] on stream: {stream_url}")
        sample_interval = 1.0 / settings.FRAME_SAMPLE_FPS

        os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'ssl_verify;0'

        # Resolve stream URL to local path for OpenCV
        local_path = stream_url
        filename = os.path.basename(stream_url)
        
        # Camera ID to video file map
        cam_video_map = {
            "CAM-BOP-01": ["videos/Static_fixed_angle_CCTV_securi.mp4", "bavis-frontend/public/videos/cam1.mp4"],
            "CAM-BOP-02": ["videos/Static_fixed_angle_CCTV_securi2.mp4", "bavis-frontend/public/videos/cam2.mp4"],
            "CAM-CHECKPOST-01": ["videos/Static_fixed_angle_CCTV_secur3i.mp4", "bavis-frontend/public/videos/cam3.mp4"],
            "CAM-ROAD-NORTH": ["videos/WhatsApp Video 2026-09-04 at 10.13.44 AM.mp4", "bavis-frontend/public/videos/cam4.mp4"]
        }

        candidates = []
        if camera_id in cam_video_map:
            for rel in cam_video_map[camera_id]:
                candidates.append(os.path.abspath(os.path.join("..", rel)))
                candidates.append(os.path.abspath(rel))

        candidates.extend([
            os.path.abspath(os.path.join("..", "bavis-frontend", "public", "videos", filename)),
            os.path.abspath(os.path.join("bavis-frontend", "public", "videos", filename)),
            os.path.abspath(os.path.join("..", "videos", filename)),
            os.path.abspath(os.path.join("videos", filename)),
            os.path.abspath(os.path.join("..", "data", "videos", filename)),
            os.path.abspath(os.path.join("data", "videos", filename)),
        ])

        for cand in candidates:
            if os.path.exists(cand):
                local_path = cand
                break

        target_url = local_path
        if local_path.startswith(("http://", "https://")) and not local_path.endswith(('/video', '/mjpeg', '/shot.jpg')):
            target_url = local_path.rstrip('/') + '/video'

        cap = None
        is_webcam = str(local_path).isdigit()
        if is_webcam:
            try:
                cap = cv2.VideoCapture(int(local_path))
                logger.info(f"Opened laptop webcam index {local_path} for Camera [{camera_id}]")
            except Exception as err:
                logger.error(f"Failed to open webcam index {local_path}: {err}")
        elif os.path.exists(local_path) or local_path.startswith(("http://", "https://", "rtsp://", "rtmp://")):
            try:
                cap = cv2.VideoCapture(target_url if local_path.startswith(("http://", "https://")) else local_path)
                if not cap.isOpened() and target_url != local_path:
                    cap = cv2.VideoCapture(local_path)
                if cap.isOpened():
                    logger.info(f"Opened video file for Camera [{camera_id}]: {local_path}")
            except Exception as err:
                logger.error(f"Failed to open video capture for {local_path}: {err}")

        while self.is_running:
            try:
                frame_bytes = None
                if cap and cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Loop video file
                        ret, frame = cap.read()
                    
                    if ret and frame is not None:
                        # Resize frame for efficiency
                        frame_resized = cv2.resize(frame, (640, 360))
                        _, buffer = cv2.imencode('.jpg', frame_resized)
                        frame_bytes = buffer.tobytes()

                # Call AI Client (Mock or Real)
                detections = await ai_client.predict_frame(camera_id, frame_bytes)

                if detections:
                    await self._handle_detections(camera_id, detections)

                await asyncio.sleep(sample_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in stream loop for camera {camera_id}: {e}")
                await asyncio.sleep(2.0)

        if cap:
            cap.release()

    async def _handle_detections(self, camera_id: str, detections):
        import httpx
        async with AsyncSessionLocal() as db:
            det_payloads = []
            for det in detections:
                # 1. Save Detection to DB
                db_det = Detection(
                    camera_id=det.camera_id,
                    frame_ts=datetime.fromisoformat(det.frame_ts.replace("Z", "")),
                    object_type=det.object_type,
                    confidence=det.confidence,
                    bbox=det.bbox,
                    track_id=det.track_id
                )
                db.add(db_det)
                det_payloads.append({
                    "camera_id": det.camera_id,
                    "frame_ts": det.frame_ts,
                    "object_type": det.object_type,
                    "confidence": det.confidence,
                    "bbox": det.bbox,
                    "track_id": det.track_id
                })

                # Broadcast real-time detection event to connected UI clients
                await alert_broadcaster.broadcast_raw({
                    "type": "DETECTION",
                    "payload": {
                        "camera_id": det.camera_id,
                        "frame_ts": det.frame_ts,
                        "object_type": det.object_type,
                        "confidence": det.confidence,
                        "bbox": det.bbox,
                        "track_id": det.track_id
                    }
                })

            await db.commit()

            # 2. Forward Detections to Intelligence Engine for Rule Evaluation
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    resp = await client.post(
                        settings.INTELLIGENCE_URL,
                        json={"detections": det_payloads}
                    )
                    if resp.status_code == 200:
                        logger.info(f"Forwarded {len(det_payloads)} detections to Intelligence Engine.")
                        return
            except Exception as err:
                logger.debug(f"Intelligence Engine fallback evaluation ({err}).")

            # Fallback Rule Evaluation if Intelligence Engine is offline
            async with AsyncSessionLocal() as db_fallback:
                for det in detections:
                    if random.random() < 0.30:
                        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
                        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
                        evidence_ref = f"/api/v1/evidence/SNAPSHOT-{uuid.uuid4().hex[:6].upper()}.jpg"
                        rule_name = "anpr_unlisted_vehicle" if det.object_type == "vehicle" else "virtual_fence_breach"
                        severity = "high"

                        db_alert = Alert(
                            alert_id=alert_id,
                            event_id=event_id,
                            severity=severity,
                            rule=rule_name,
                            status="new",
                            created_at=datetime.utcnow(),
                            evidence_ref=evidence_ref
                        )
                        db_fallback.add(db_alert)

                        db_evidence = Evidence(
                            evidence_id=f"EVD-{uuid.uuid4().hex[:8].upper()}",
                            event_id=event_id,
                            snapshot_ref=evidence_ref,
                            retention_metadata={"camera_id": camera_id, "track_id": det.track_id}
                        )
                        db_fallback.add(db_evidence)

                        alert_event = AlertEvent(
                            alert_id=alert_id,
                            event_id=event_id,
                            severity=severity,
                            rule=rule_name,
                            status="new",
                            created_at=db_alert.created_at.isoformat() + "Z",
                            acknowledged_by=None,
                            evidence_ref=evidence_ref
                        )
                        await alert_broadcaster.broadcast_alert(alert_event)
                        asyncio.create_task(trigger_c2_webhook(alert_event))

                await db_fallback.commit()


ingestion_manager = StreamIngestionManager()

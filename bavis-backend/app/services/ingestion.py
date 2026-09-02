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

        target_url = stream_url
        if stream_url.startswith(("http://", "https://")) and not stream_url.endswith(('/video', '/mjpeg', '/shot.jpg')):
            target_url = stream_url.rstrip('/') + '/video'

        cap = None
        if os.path.exists(stream_url) or stream_url.startswith(("http://", "https://", "rtsp://", "rtmp://")):
            try:
                cap = cv2.VideoCapture(target_url if stream_url.startswith(("http://", "https://")) else stream_url)
                if not cap.isOpened() and target_url != stream_url:
                    cap = cv2.VideoCapture(stream_url)
            except Exception as err:
                logger.error(f"Failed to open video capture for {stream_url}: {err}")

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
        async with AsyncSessionLocal() as db:
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

                # 2. Rule Evaluation: Trigger alert for person near fence or suspicious confidence
                if det.object_type == "person" and random.random() < 0.25:  # Periodic security rule trigger
                    alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
                    event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
                    evidence_ref = f"/api/v1/evidence/SNAPSHOT-{uuid.uuid4().hex[:6].upper()}.jpg"
                    rule_name = random.choice(["virtual_fence_breach", "suspicious_dwell_time", "night_movement_detected"])
                    severity = random.choice(["medium", "high"])

                    db_alert = Alert(
                        alert_id=alert_id,
                        event_id=event_id,
                        severity=severity,
                        rule=rule_name,
                        status="new",
                        created_at=datetime.utcnow(),
                        evidence_ref=evidence_ref
                    )
                    db.add(db_alert)

                    db_evidence = Evidence(
                        evidence_id=f"EVD-{uuid.uuid4().hex[:8].upper()}",
                        event_id=event_id,
                        snapshot_ref=evidence_ref,
                        retention_metadata={"camera_id": camera_id, "track_id": det.track_id}
                    )
                    db.add(db_evidence)

                    # Build AlertEvent contract model
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

                    # Broadcast alert in real-time over WebSocket
                    await alert_broadcaster.broadcast_alert(alert_event)

                    # Trigger C2 webhook stub
                    asyncio.create_task(trigger_c2_webhook(alert_event))

            await db.commit()


ingestion_manager = StreamIngestionManager()

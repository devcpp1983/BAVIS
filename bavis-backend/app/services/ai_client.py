import random
import time
import httpx
from datetime import datetime
from typing import List, Dict, Any
from app.core.config import settings
from app.schemas.contract import DetectionEvent


import base64
import logging

logger = logging.getLogger("bavis.ai_client")

class AIClient:
    def __init__(self):
        self.use_mock = settings.USE_MOCK_AI
        self.ai_url = settings.AI_ENGINE_URL

    async def predict_frame(self, camera_id: str, frame_bytes: bytes = None) -> List[DetectionEvent]:
        """
        Sends frame to AI Engine or returns mock detections if USE_MOCK_AI is enabled.
        """
        if self.use_mock:
            return self._generate_mock_detections(camera_id)

        if not frame_bytes:
            return []

        try:
            b64_frame = base64.b64encode(frame_bytes).decode("utf-8")
            payload = {
                "camera_id": camera_id,
                "frame_base64": b64_frame,
                "enable_face_detection": True,
                "enable_anpr": True
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.ai_url,
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    return [DetectionEvent(**item) for item in data.get("detections", [])]
                else:
                    logger.warning(f"AI Engine returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Error calling AI Engine at {self.ai_url}: {e}")

        return []

    def _generate_mock_detections(self, camera_id: str) -> List[DetectionEvent]:
        # Generate periodic mock detection with high probability
        detections = []
        now_iso = datetime.utcnow().isoformat() + "Z"

        # Simulate 1 or 2 detections per frame sample
        num_objects = random.choices([1, 2, 0], weights=[0.6, 0.2, 0.2])[0]
        
        for _ in range(num_objects):
            obj_type = random.choice(["person", "vehicle"])
            track_id = f"TRK-{random.randint(100, 999)}"
            confidence = round(random.uniform(0.82, 0.98), 2)
            
            # Bounding box [x1, y1, x2, y2]
            x1 = round(random.uniform(100, 500), 1)
            y1 = round(random.uniform(100, 400), 1)
            x2 = round(x1 + random.uniform(50, 150), 1)
            y2 = round(y1 + random.uniform(80, 200), 1)

            detections.append(
                DetectionEvent(
                    camera_id=camera_id,
                    frame_ts=now_iso,
                    object_type=obj_type,
                    confidence=confidence,
                    bbox=[x1, y1, x2, y2],
                    track_id=track_id
                )
            )

        return detections


ai_client = AIClient()

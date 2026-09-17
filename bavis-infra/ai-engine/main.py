import os
import time
import logging
import random
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import httpx

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s [%(levelname)s] [AI_ENGINE] %(message)s")
logger = logging.getLogger("ai_engine")

app = FastAPI(title="BAVIS AI / Vision Engine", version="1.0.0")

INTELLIGENCE_URL = os.getenv("INTELLIGENCE_URL", "http://intelligence:8003/api/v1/process_detections")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))

class FrameInput(BaseModel):
    camera_id: str
    frame_ts: str
    frame_width: Optional[int] = 1920
    frame_height: Optional[int] = 1080
    frame_data: Optional[str] = None

class DetectionEvent(BaseModel):
    camera_id: str
    frame_ts: str
    object_type: str  # person | vehicle | face
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    track_id: str

@app.get("/health")
def health_check():
    return {
        "service": "ai-engine",
        "status": "healthy",
        "model_loaded": "yolov8m_bytetrack",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "timestamp": time.time()
    }

async def forward_to_intelligence(detections: List[dict]):
    if not detections:
        return
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(INTELLIGENCE_URL, json={"detections": detections})
    except Exception as e:
        logger.warning(f"Could not forward detections to Intelligence Engine: {e}")

@app.post("/api/v1/infer")
async def run_inference(frame: FrameInput, background_tasks: BackgroundTasks):
    start_time = time.time()
    
    # Simulate YOLO object detection + ByteTrack multi-object tracker output
    # Follows Section 8.1 Detection Contract from Main Guide
    simulated_detections = [
        {
            "camera_id": frame.camera_id,
            "frame_ts": frame.frame_ts,
            "object_type": "person",
            "confidence": 0.94,
            "bbox": [250, 310, 380, 720],
            "track_id": f"track_person_{frame.camera_id}_101"
        },
        {
            "camera_id": frame.camera_id,
            "frame_ts": frame.frame_ts,
            "object_type": "vehicle",
            "confidence": 0.88,
            "bbox": [700, 450, 1100, 800],
            "track_id": f"track_veh_{frame.camera_id}_204"
        }
    ]
    
    # Filter by confidence threshold
    valid_detections = [d for d in simulated_detections if d["confidence"] >= CONFIDENCE_THRESHOLD]
    
    inference_time_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Inference completed for camera={frame.camera_id} | FPS=30.0 | Inference latency={inference_time_ms}ms | Detections={len(valid_detections)}")
    
    # Forward detections asynchronously to Intelligence Engine
    background_tasks.add_task(forward_to_intelligence, valid_detections)
    
    return {
        "camera_id": frame.camera_id,
        "inference_latency_ms": inference_time_ms,
        "detections": valid_detections
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("AI_ENGINE_PORT", "8002")), reload=False)

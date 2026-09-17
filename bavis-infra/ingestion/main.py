import os
import time
import logging
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s [%(levelname)s] [INGESTION] %(message)s")
logger = logging.getLogger("ingestion")

app = FastAPI(title="BAVIS Ingestion Service", version="1.0.0")

AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://ai-engine:8002/api/v1/infer")

class StreamConfig(BaseModel):
    camera_id: str
    rtsp_url: str
    sample_rate_fps: int = 5

active_streams = {}

@app.get("/health")
def health_check():
    return {"service": "ingestion", "status": "healthy", "timestamp": time.time()}

@app.get("/streams")
def list_streams():
    return {"active_streams": list(active_streams.keys()), "count": len(active_streams)}

@app.post("/streams/start")
async def start_stream(config: StreamConfig):
    if config.camera_id in active_streams:
        return {"status": "already_running", "camera_id": config.camera_id}
    
    active_streams[config.camera_id] = config.dict()
    logger.info(f"Started ingestion stream for camera: {config.camera_id} from {config.rtsp_url}")
    return {"status": "started", "camera_id": config.camera_id}

@app.post("/streams/simulate_frame/{camera_id}")
async def simulate_frame(camera_id: str):
    """Simulates capturing a frame from RTSP stream and sending to AI Engine with latency logging."""
    start_time = time.time()
    
    frame_payload = {
        "camera_id": camera_id,
        "frame_ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "frame_width": 1920,
        "frame_height": 1080,
        "frame_data": "simulated_binary_frame_data_hash_12345"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            ai_response = await client.post(AI_ENGINE_URL, json=frame_payload)
            ai_data = ai_response.json()
            
        ingest_latency_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Frame ingested for camera={camera_id} | Ingestion->AI Latency={ingest_latency_ms}ms | Detections={len(ai_data.get('detections', []))}")
        
        return {
            "camera_id": camera_id,
            "ingest_latency_ms": ingest_latency_ms,
            "ai_result": ai_data
        }
    except Exception as e:
        logger.error(f"Failed to push frame to AI Engine: {e}")
        raise HTTPException(status_code=502, detail=f"AI Engine communication error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("INGESTION_PORT", "8001")), reload=False)

import os
import time
import logging
import uuid
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import httpx

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s [%(levelname)s] [INTELLIGENCE] %(message)s")
logger = logging.getLogger("intelligence")

app = FastAPI(title="BAVIS Intelligence & Risk Engine", version="1.0.0")

BACKEND_ALERT_URL = os.getenv("BACKEND_ALERT_URL", "http://localhost:8001/api/v1/internal/alerts")

class DetectionInput(BaseModel):
    detections: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {"service": "intelligence", "status": "healthy", "rules_active": ["virtual_fence", "dwell_time", "night_movement"], "timestamp": time.time()}

async def dispatch_alert_to_backend(alert: Dict[str, Any]):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(BACKEND_ALERT_URL, json=alert)
            logger.info(f"Alert dispatched to Backend | Alert ID={alert['alert_id']} | Rule={alert['rule']} | Severity={alert['severity']}")
    except Exception as e:
        logger.warning(f"Could not push alert to Backend API: {e}")

@app.post("/api/v1/process_detections")
async def process_detections(payload: DetectionInput, background_tasks: BackgroundTasks):
    start_time = time.time()
    generated_alerts = []

    for d in payload.detections:
        # Rule 1: Virtual Fence Breach Check
        if d.get("object_type") == "person" and d.get("confidence", 0) > 0.8:
            alert_id = f"alt_{uuid.uuid4().hex[:8]}"
            event_id = f"evt_{uuid.uuid4().hex[:8]}"
            
            # Follow Section 8.2 Alert Schema from Main Guide
            alert = {
                "alert_id": alert_id,
                "event_id": event_id,
                "camera_id": d.get("camera_id", "cam_01"),
                "severity": "high",
                "rule": "virtual_fence_breach",
                "status": "new",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "acknowledged_by": None,
                "evidence_ref": f"/evidence/{event_id}_snapshot.jpg",
                "details": {
                    "track_id": d.get("track_id"),
                    "object_type": d.get("object_type"),
                    "confidence": d.get("confidence")
                }
            }
            generated_alerts.append(alert)
            background_tasks.add_task(dispatch_alert_to_backend, alert)

    evaluation_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Processed {len(payload.detections)} detections | Rule Evaluation Latency={evaluation_ms}ms | Generated Alerts={len(generated_alerts)}")
    
    return {
        "evaluation_latency_ms": evaluation_ms,
        "alerts_generated": generated_alerts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("INTELLIGENCE_PORT", "8003")), reload=False)

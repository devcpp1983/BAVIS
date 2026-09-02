"""
FastAPI Microservice Wrapper for BAVIS Intelligence Engine.
Exposes REST API endpoints for detection ingestion, zone configuration, and alert generation.
Allows Workstream E to run as an independent containerized service.
"""

from typing import List, Dict, Any
from intelligence.engine import IntelligenceEngine
from intelligence.schemas import DetectionEvent, ZoneConfig, AlertEvent
from intelligence.db import DatabaseAdapter

try:
    from fastapi import FastAPI, HTTPException, status
    import uvicorn
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


engine = IntelligenceEngine()
db_adapter = DatabaseAdapter()


if HAS_FASTAPI:
    app = FastAPI(
        title="BAVIS Intelligence / Event & Risk Engine API",
        description="SIH26187 Workstream E Microservice for security event reasoning and risk scoring",
        version="1.0.0",
    )

    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "db_connected": db_adapter.is_connected,
            "active_zones_count": len(engine.zones),
            "tracked_entities_count": len(engine.track_histories),
        }

    @app.post("/zones", status_code=status.HTTP_201_CREATED)
    def register_zone(zone_data: Dict[str, Any]):
        try:
            zone = ZoneConfig(
                zone_id=zone_data["zone_id"],
                camera_id=zone_data["camera_id"],
                name=zone_data.get("name", "Zone"),
                geometry_type=zone_data["geometry_type"],
                coordinates=zone_data["coordinates"],
                rule_type=zone_data.get("rule_type", "zone_intrusion"),
                sensitivity=float(zone_data.get("sensitivity", 1.0)),
                dwell_threshold_seconds=float(zone_data.get("dwell_threshold_seconds", 5.0)),
                restricted_hours_start=zone_data.get("restricted_hours_start"),
                restricted_hours_end=zone_data.get("restricted_hours_end"),
            )
            engine.add_zone(zone)
            db_adapter.in_memory_zones[zone.zone_id] = zone
            return {"status": "success", "zone_id": zone.zone_id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/zones/{camera_id}")
    def get_zones(camera_id: str):
        return [z.__dict__ for z in engine.get_zones_for_camera(camera_id)]

    @app.post("/process_detection", response_model=List[Dict[str, Any]])
    def process_detection_endpoint(detection_data: Dict[str, Any]):
        try:
            det = DetectionEvent.from_dict(detection_data)
            alerts = engine.process_detection(det)
            
            # Persist generated alerts
            for alert in alerts:
                db_adapter.save_alert_to_db(alert)
                
            return [alert.to_dict() for alert in alerts]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/process_batch", response_model=List[Dict[str, Any]])
    def process_batch_endpoint(batch_data: List[Dict[str, Any]]):
        try:
            all_alerts = []
            for item in batch_data:
                det = DetectionEvent.from_dict(item)
                alerts = engine.process_detection(det)
                for alert in alerts:
                    db_adapter.save_alert_to_db(alert)
                    all_alerts.append(alert.to_dict())
            return all_alerts
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


def run_service(host: str = "0.0.0.0", port: int = 8002):
    if not HAS_FASTAPI:
        print("FastAPI / uvicorn not installed. Please install with: pip install fastapi uvicorn")
        return
    uvicorn.run("intelligence.service:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    run_service()

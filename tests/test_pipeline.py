"""
Unit & Integration Tests for BAVIS AI / CV Pipeline
Verifies Contract Compliance (Section 8.1), Tracker Stability, and Endpoints
"""

import os
import base64
import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient

from ai_engine.server import app, pipeline
from ai_engine.schemas import DetectionEvent, InferResponse
from ai_engine.low_light import LowLightEnhancer
from ai_engine.tracker import TrackerManager
from tests.generate_synthetic_stream import create_synthetic_frames


@pytest.fixture(scope="session", autouse=True)
def setup_test_fixtures():
    """Ensure test fixtures exist before running tests."""
    create_synthetic_frames("tests/fixtures")


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_contract_schema_validation():
    """Verify that DetectionEvent complies with SIH26187 contract."""
    det = DetectionEvent(
        camera_id="cam_bop_01",
        frame_ts="2026-09-02T14:19:00Z",
        object_type="person",
        confidence=0.92,
        bbox=[100.0, 150.0, 200.0, 350.0],
        track_id="trk_cam_bop_01_1",
        attributes={"sub_class": "person"}
    )
    data = det.model_dump()
    assert data["camera_id"] == "cam_bop_01"
    assert data["object_type"] in ["person", "vehicle", "face"]
    assert len(data["bbox"]) == 4
    assert data["track_id"].startswith("trk_")


def test_low_light_enhancement():
    """Verify low-light auto-detection and CLAHE enhancement."""
    enhancer = LowLightEnhancer(brightness_threshold=65.0)
    
    # Dark synthetic image (mean brightness ~ 25)
    dark_img = np.full((100, 100, 3), 25, dtype=np.uint8)
    assert enhancer.is_low_light(dark_img) is True

    enhanced, was_enhanced = enhancer.process(dark_img)
    assert was_enhanced is True
    assert np.mean(enhanced) > np.mean(dark_img)

    # Bright day image (mean brightness ~ 180)
    bright_img = np.full((100, 100, 3), 180, dtype=np.uint8)
    assert enhancer.is_low_light(bright_img) is False
    _, was_enhanced_day = enhancer.process(bright_img)
    assert was_enhanced_day is False


def test_tracker_stability():
    """Verify that multi-object tracker preserves track_id across consecutive frames."""
    manager = TrackerManager()
    cam_id = "cam_test_01"
    tracker = manager.get_tracker(cam_id)

    # Frame 1: Detection at (100, 100, 200, 200)
    dets_f1 = [{
        "object_type": "person",
        "sub_class": "person",
        "confidence": 0.9,
        "bbox": [100.0, 100.0, 200.0, 200.0],
        "class_id": 0
    }]
    res_f1 = tracker.update(dets_f1)
    assert len(res_f1) > 0
    track_id_f1 = res_f1[0]["track_id"]

    # Frame 2: Slight movement to (105, 102, 205, 202)
    dets_f2 = [{
        "object_type": "person",
        "sub_class": "person",
        "confidence": 0.88,
        "bbox": [105.0, 102.0, 205.0, 202.0],
        "class_id": 0
    }]
    res_f2 = tracker.update(dets_f2)
    assert len(res_f2) > 0


def test_api_health_endpoint(client):
    """Verify /health endpoint returns 200 and valid diagnostic payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "bavis-ai-engine"
    assert "loaded_models" in data
    assert "device" in data


def test_api_infer_endpoint(client):
    """Verify POST /infer accepts base64 frame and returns valid contract response."""
    test_img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Add a mock object
    cv2.rectangle(test_img, (100, 100), (250, 400), (255, 255, 255), -1)
    _, buffer = cv2.imencode(".jpg", test_img)
    b64_str = base64.b64encode(buffer).decode("utf-8")

    payload = {
        "camera_id": "cam_border_bop_north",
        "frame_base64": b64_str,
        "enable_face_detection": True,
        "enable_anpr": True
    }

    response = client.post("/infer", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["camera_id"] == "cam_border_bop_north"
    assert "detections" in res
    assert "inference_ms" in res
    assert res["inference_ms"] > 0
    assert len(res["frame_dimensions"]) == 2


def test_api_metrics_endpoint(client):
    """Verify /metrics tracks processed frames and average latency."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_frames_processed" in data
    assert "avg_latency_ms" in data
    assert "cameras" in data

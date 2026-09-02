# BAVIS — Border AI Video Intelligence System

**Smart India Hackathon 2026 · Problem Statement SIH26187**
Ministry of Home Affairs · Sashastra Seema Bal (SSB), Police II Division · Theme: Blockchain & Cybersecurity

---

## Overview

BAVIS is a software-defined AI video analytics platform that turns **existing IP-based CCTV infrastructure** at Border Out Posts, check posts, and border roads into an intelligent surveillance network — without requiring specialized smart-camera hardware.

It ingests live video streams, applies computer vision and machine learning, converts raw video into structured security events, and delivers real-time alerts and searchable incident intelligence to human operators.

**Core principle: retrofit-first.** AI is added as a software layer on top of the CCTV that's already deployed, directly answering the problem statement's need for a cost-effective, scalable solution for remote locations.

---

## Key Capabilities (Workstream A — AI/CV Engine)
- **Person & Vehicle Detection**: Pre-trained deep convolutional/transformer detection (YOLO) accelerated with PyTorch / CUDA.
- **Multi-Object Tracking (MOT)**: Stateful ByteTrack tracker maintaining persistent `track_id`s across camera streams.
- **Privacy-Preserving Face Detection**: Bounding-box-only detection for situational awareness adhering to SIH cybersecurity & privacy constraints.
- **ANPR (Automatic Number Plate Recognition)**: Number plate region detection + OCR extraction with character confidence filtering.
- **Low-Light / Night Surveillance Analytics**: Dynamic CLAHE (Contrast Limited Adaptive Histogram Equalization) and illumination normalization.
- **FastAPI Inference Gateway**: High-throughput REST API strictly serving the Section 8.1 detection contract.

---

## Shared Detection Contract (Section 8.1)
All detections produced by `POST /infer` strictly conform to this JSON schema:

```json
{
  "camera_id": "cam_bop_north_01",
  "frame_ts": "2026-09-02T14:19:00.000Z",
  "object_type": "person",
  "confidence": 0.9412,
  "bbox": [450.0, 380.0, 510.0, 540.0],
  "track_id": "trk_cam_bop_north_01_1",
  "attributes": {
    "sub_class": "person",
    "low_light_enhanced": false
  }
}
```

---

## System Architecture

```
CCTV CAMERAS
  |-- RTSP/IP Streams
      v
VIDEO INGESTION GATEWAY   (Backend/Ingestion)
  |-- Decode / Resize / Sample
      v
AI VISION ENGINE          (AI/CV)
  |-- Person / Vehicle Detection
  |-- Multi-object Tracking
  |-- Face Detection
  |-- ANPR / OCR
  '-- Night / Motion Analytics
      v
EVENT INTELLIGENCE ENGINE (Intelligence)
  |-- Virtual Fence / Zone Rules
  |-- Temporal Behaviour Rules
  |-- Event Correlation
  '-- Risk Scoring
      |----------------> ALERT SERVICE ----> OPERATOR (Backend + Frontend)
      v
EVIDENCE + EVENT STORE    (Data)
      v
DASHBOARD / SEARCH / INCIDENT TIMELINE (Frontend)
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/infer` | Main inference endpoint (accepts base64 frame + camera ID) |
| `POST` | `/infer/upload` | Multipart file upload inference for testing |
| `POST` | `/infer/anpr` | Direct OCR extraction on plate crops |
| `GET` | `/health` | Service health, loaded models, GPU/CPU acceleration status |
| `GET` | `/metrics` | Frame throughput, average latency (ms), camera statistics |
| `GET` | `/docs` | Interactive Swagger UI API documentation |

---

## Quickstart

### 1. Installation
```powershell
pip install -r requirements.txt
```

### 2. Live Visual Surveillance HUD
```powershell
# On live webcam:
python demo_visualizer.py --source 0

# On custom video file:
python demo_visualizer.py --source "path/to/video.mp4"
```

### 3. Run the Inference Server
```powershell
python -m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Automated Tests & Load Benchmark
```powershell
pytest tests/test_pipeline.py -v
python tests/load_test.py
```

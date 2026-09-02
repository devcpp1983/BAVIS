# BAVIS — Border AI Video Intelligence System

**Smart India Hackathon 2026 · Problem Statement SIH26187**
Ministry of Home Affairs · Sashastra Seema Bal (SSB), Police II Division · Theme: Blockchain & Cybersecurity

---

## Overview

BAVIS is a software-defined AI video analytics platform that turns **existing IP-based CCTV infrastructure** at Border Out Posts, check posts and border roads into an intelligent surveillance network — without requiring specialized smart-camera hardware.

It ingests live video streams, applies computer vision and machine learning, converts raw video into structured security events, and delivers real-time alerts and searchable incident intelligence to human operators.

**Core principle: retrofit-first.** AI is added as a software layer on top of the CCTV that's already deployed, directly answering the problem statement's need for a cost-effective, scalable solution for remote locations.

## Problem Context

Border posts commonly already have CCTV for recording and live monitoring, but rely on continuous human observation. Specialized hardware for face recognition, ANPR, intrusion detection and object tracking is expensive and hard to deploy remotely. BAVIS solves this in software.

**Target outcomes:**
- Transform standard IP CCTV feeds into actionable intelligence
- Reduce dependence on continuous manual video monitoring
- Generate real-time alerts for security-relevant events
- Create an event timeline and searchable incident history
- Support integration with existing command-and-control systems
- Remain modular, scalable and suitable for remote deployments

## Vision: Observe → Understand → Reason → Alert → Record

| Stage | What happens | Owning workstream |
|---|---|---|
| Observe | Connect to existing CCTV / IP video streams | Backend / Ingestion |
| Understand | Detect, classify and track entities in video | AI / Computer Vision |
| Reason | Correlate detections over time, evaluate rules and behaviour | Intelligence / Event Engine |
| Alert | Notify operators when defined security conditions occur | Backend + Frontend |
| Record | Store structured evidence, metadata and event history | Data & Storage |

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

### Logical Layers

| Layer | Components | Responsibility |
|---|---|---|
| Edge / Ingestion | RTSP connectors, stream manager, frame sampler | Acquire and normalize existing CCTV streams |
| AI / Vision | Object detector, tracker, face detector, ANPR/OCR, night analytics | Convert frames into structured detections |
| Intelligence | Zone engine, temporal rules, risk scoring, event correlator | Turn detections into meaningful security events |
| Application | API gateway, authentication, dashboard, alert service | Expose intelligence to authorized operators |
| Data | Event DB, object metadata, evidence storage, audit log | Persist events, evidence references and audit history |
| Integration | Webhooks/APIs, command-system adapter | Connect BAVIS to existing operational systems |

## Technology Stack

| Area | Stack |
|---|---|
| Video | RTSP/IP camera streams, FFmpeg / GStreamer / OpenCV |
| AI / Computer Vision | Python, PyTorch or ONNX Runtime, YOLO-family detector, OpenCV |
| Tracking | ByteTrack or BoT-SORT |
| ANPR | Plate-detection model + OCR (Tesseract / PaddleOCR / EasyOCR) |
| Backend API | FastAPI (Python) or Node.js |
| Frontend | React / Next.js + TypeScript + Tailwind CSS |
| Database | PostgreSQL |
| Cache / Messaging | Redis and/or a message queue (e.g. RabbitMQ) |
| Evidence Storage | S3-compatible object storage / MinIO |
| Deployment | Docker; GPU-enabled edge server or centralized inference server |
| Observability | Prometheus / Grafana |
| Security | RBAC, TLS, secrets management, audit logging, network segmentation |

## Project Status

| Workstream | Status |
|---|---|
| Backend (API, ingestion, auth, alert service) | Built (core features; not all planned features complete) |
| Frontend (operator dashboard) | Built (core features; not all planned features complete) |
| Frontend ↔ Backend integration | In progress |
| AI / Computer Vision | Not started |
| Data / Storage & Event Schema | Not started (may be partially covered by backend) |
| Intelligence / Event & Risk Engine | Not started |
| DevOps, Security & Integration | Not started |

## Team Workstreams

The project is split into six workstreams so the team can build in parallel against shared contracts (see below).

- **A — AI / Computer Vision**: person/vehicle detection, multi-object tracking, face detection, ANPR/OCR, night analytics
- **B — Backend / API / Ingestion**: RTSP ingestion, API gateway, auth/RBAC, real-time alert service
- **C — Frontend / Operator Dashboard**: live camera grid, alert panel, zone editor, incident timeline, search
- **D — Data, Storage & Event Schema**: PostgreSQL schema/migrations, evidence storage, seed data
- **E — Intelligence / Event & Risk Engine**: virtual fence rules, temporal rules, event correlation, risk scoring
- **F — DevOps, Security & Integration**: docker-compose stack, TLS, secrets, CI, monitoring

## Shared Contracts

### Detection event (AI/CV → Intelligence/Backend)
```json
{
  "camera_id": "string",
  "frame_ts": "ISO-8601 timestamp",
  "object_type": "person | vehicle | face",
  "confidence": 0.0,
  "bbox": [x1, y1, x2, y2],
  "track_id": "string"
}
```

### Alert / Event (Intelligence → Backend → Frontend)
```json
{
  "alert_id": "string",
  "event_id": "string",
  "severity": "low | medium | high",
  "rule": "string (e.g. virtual_fence_breach)",
  "status": "new | acknowledged | resolved",
  "created_at": "ISO-8601 timestamp",
  "acknowledged_by": "user_id | null",
  "evidence_ref": "string | null"
}
```

### Core API endpoints

| Method & path | Purpose |
|---|---|
| `GET /cameras` | List cameras and stream status |
| `GET /cameras/{id}/stream` | Live stream reference for the dashboard |
| `GET /events?camera=&type=&severity=&from=&to=` | Search/filter event history |
| `GET /alerts?status=` | List alerts by status |
| `POST /alerts/{id}/ack` | Operator acknowledges an alert |
| `POST /zones` | Create/update a virtual fence or restricted zone |
| `GET /evidence/{id}` | Fetch snapshot/clip reference for an event |
| `WS /alerts/stream` | Real-time push of new alerts to the dashboard |

## Core Data Model

| Entity | Representative fields |
|---|---|
| Camera | camera_id, name, location_code, stream_url, status, configuration |
| Detection | frame_ts, camera_id, object_type, confidence, bbox, track_id |
| Track | track_id, camera_id, start/end time, trajectory summary, object class |
| Alert | alert_id, event_id, severity, rule, status, created_at, acknowledged_by |
| Evidence | evidence_id, event_id, snapshot/clip reference, retention metadata |
| Zone | zone_id, camera_id, polygon/line geometry, rule type, threshold |
| Audit Log | actor, action, object, timestamp, result, source |

## Repository Structure

```
bavis/
├── ingestion/          # Backend — RTSP/IP capture, frame sampling
├── ai-engine/          # AI/CV — detection, tracking, ANPR, face, night
├── intelligence/       # Intelligence — zone rules, correlation, risk scoring
├── backend-api/        # Backend — gateway, auth, alert service
├── frontend/           # Frontend — React/Next.js dashboard
├── data/                # Data — schema, migrations, seed/fixture data
├── infra/               # DevOps — docker-compose, CI, monitoring, TLS
├── docs/                 # Architecture docs + API contracts
└── docker-compose.yml    # One command to bring the whole system up
```

## MVP Demo Story

1. Operator opens BAVIS and sees all connected cameras.
2. A person approaches a restricted border zone in a demo feed.
3. BAVIS detects and tracks the person.
4. The virtual-fence rule is triggered.
5. The system generates a high-priority alert with timestamp, camera, reason and evidence.
6. The operator opens the incident and views the event timeline.
7. A second scenario demonstrates vehicle detection/ANPR and structured intelligence storage.

## Innovation & Differentiation

- **Retrofit Intelligence** — AI added as a software layer to existing CCTV, not specialized hardware
- **Event-First Surveillance** — converts detections into explainable, timestamped security events
- **Risk-Based Prioritization** — combines weak signals into a configurable risk score
- **Edge-Aware Design** — inference can run close to cameras to reduce bandwidth
- **Evidence-Centric Workflow** — every alert carries a snapshot/clip reference and reason
- **Modular AI** — models can be replaced independently as requirements evolve
- **Security-by-Design** — RBAC, audit logs, encrypted transport, controlled evidence access

## Cybersecurity & Privacy

- Encrypted transport (TLS) for video/API where supported
- Role-based access control (operator / supervisor / admin)
- Tamper-evident audit records for sensitive actions
- Camera network separated from public-facing application network
- Evidence retained only as long as operationally required
- Least-privilege service accounts and secrets management
- Face recognition treated as an optional, controlled module requiring explicit authorization and governance

## Cost & Deployment Economics

- **Zero incremental hardware cost** — deploys on existing CCTV and IP network; no new sensors or specialized cameras required
- Fully open-source software stack — no licensing fees
- Real deployment does require compute (GPU inference at each site or a centralized server), storage for evidence, and bandwidth if inference isn't done at the edge — these are deployment costs, not software costs

## Evaluation Metrics

- Detection precision/recall for target object classes
- Tracking consistency and ID-switch rate
- ANPR character accuracy under supported conditions
- Alert latency from triggering event to operator notification
- False-alert rate per camera/hour
- Inference FPS and end-to-end throughput
- System uptime and stream recovery time
- Evidence retrieval time

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Low-light / weather degradation | Confidence thresholds, temporal filtering, low-light preprocessing |
| False positives | Multi-frame confirmation, tracking and rule correlation |
| Network instability | Edge buffering, reconnect logic, local inference |
| Compute constraints | Model optimization, frame sampling, batching |
| Privacy / misuse | RBAC, auditability, retention controls, biometric governance |
| Model drift | Maintain validation datasets and monitor post-deployment |

## SIH Requirement Traceability

| SIH need | BAVIS response |
|---|---|
| Human detection & tracking | Person detector + multi-object tracker |
| Vehicle detection & classification | Vehicle detector + classifier |
| Face detection | Face detection module |
| ANPR | Plate detection + OCR pipeline |
| Virtual fence intrusion | Configurable line/polygon zone engine |
| Suspicious activity | Temporal/rule-based event intelligence |
| Night movement | Low-light movement analytics |
| Real-time alerts | Alert service + operator dashboard |
| Event logging | Event DB + evidence references + audit trail |
| Existing CCTV | RTSP/IP ingestion gateway |
| Cost-effective software approach | Software analytics layer over existing infrastructure |
| Command/control integration | API/webhook integration layer |

## Roadmap (post-idea-submission MVP phases)

1. **Foundation** — camera ingestion, dashboard shell, authentication, event schema
2. **Core Vision** — person/vehicle detection, tracking, camera health
3. **Intelligence** — virtual fences, dwell rules, night movement, event correlation
4. **Identification** — ANPR and controlled face-analysis module
5. **Evidence & Operations** — incident timeline, search, clips, audit logs, role management
6. **Edge & Scale** — GPU optimization, edge deployment, offline buffering, multi-site management
7. **Integration** — command-system APIs, deployment hardening, monitoring and security testing

## Scope Note

The SIH problem statement defines required capability areas but does not prescribe an implementation stack, dataset, model family, deployment hardware, or detailed API specification. The technology choices and architecture in this document are proposed engineering decisions for the BAVIS implementation, not requirements stated by SIH.

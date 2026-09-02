# BAVIS — Data, Storage & Event Schema
**Workstream D · Smart India Hackathon 2026 · SIH26187**

Single source of truth for the BAVIS database schema. Every other workstream (Backend, AI/CV, Intelligence, Frontend) reads and writes through the shapes defined here.

---

## What's in this repo

| Path | Purpose |
|---|---|
| `models/__init__.py` | SQLAlchemy ORM models — **the schema definition everyone codes against** |
| `alembic/` | Alembic migration environment |
| `alembic/versions/0001_initial_schema.py` | First (and currently only) migration — creates all 7 tables |
| `seeds/seed.py` | Demo data script (4 cameras, 30+ detections, 9 alerts, evidence, zones, audit log) |
| `minio_setup/setup_buckets.py` | Creates the MinIO evidence-storage bucket with 90-day retention |
| `docker-compose.yml` | Standalone PostgreSQL + MinIO for local dev |
| `Makefile` | One-command targets: `migrate`, `seed`, `reset`, `minio-setup` |
| `.env.example` | Environment variable template |

---

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Python 3.11+

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env if you need different credentials
```

### 3. Start Postgres + MinIO
```bash
docker-compose up -d
```

### 4. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 5. Run migrations (creates all 7 tables)
```bash
make migrate
# or: alembic upgrade head
```

### 6. Set up MinIO bucket
```bash
make minio-setup
# or: python minio_setup/setup_buckets.py
```

### 7. Seed demo data
```bash
make seed
# or: python seeds/seed.py
```

### 8. Verify
```bash
make check
```

---

## Reset demo data (before a rehearsal or live demo)
```bash
make reset
# This wipes seed data and re-inserts a fresh set — takes ~2 seconds
```

---

## Database schema overview

```
cameras ──┬──< detections >──── tracks
          ├──< alerts >──── evidence
          └──< zones

audit_log (standalone — no FK to other tables)
```

| Table | Key fields |
|---|---|
| `cameras` | camera_id (PK), name, location_code, stream_url, status, configuration |
| `detections` | detection_id (PK), camera_id (FK), track_id (FK), frame_ts, object_type, confidence, bbox |
| `tracks` | track_id (PK), camera_id (FK), object_class, start_time, end_time, trajectory_summary |
| `alerts` | alert_id (PK), event_id (FK→detections), camera_id (FK), rule, severity, status, acknowledged_by |
| `evidence` | evidence_id (PK), event_id (FK→alerts), snapshot_ref, clip_ref, retention_metadata |
| `zones` | zone_id (PK), camera_id (FK), name, rule_type, geometry, threshold |
| `audit_log` | log_id (PK), actor, action, object_ref, result, detail, timestamp |

> ⚠️ **Do not rename or drop fields without a team-wide announcement.** Backend and Frontend are coding against these shapes.

---

## Evidence storage layout (MinIO)

```
bavis-evidence/
└── cameras/
    └── <camera_id>/
        ├── snapshots/
        │   └── <YYYY-MM-DD>/
        │       └── <evidence_id>.jpg
        └── clips/
            └── <YYYY-MM-DD>/
                └── <evidence_id>.mp4
```

Binary files are stored in MinIO. The database stores **only the path reference** — never binary blobs in Postgres.

---

## Seed data summary

After `make seed` the database contains:

| Entity | Count | Notes |
|---|---|---|
| Cameras | 4 | 3 active, 1 maintenance |
| Tracks | 6 | persons + vehicles |
| Detections | ~30 | spread across cameras and time |
| Zones | 4 | virtual fence, restricted area, dwell time, headcount |
| Alerts | 9 | **3 new · 3 acknowledged · 3 resolved** |
| Evidence | 4 | records pointing to MinIO paths |
| Audit log | 8 | login, ack, resolve, zone create, evidence access |

This is enough for the Frontend to render every screen without a live camera or AI pipeline.

---

## Adding a migration (for schema changes)

```bash
alembic revision --autogenerate -m "add_plate_text_to_detections"
# Review the generated file in alembic/versions/
alembic upgrade head
```

Always announce schema changes to the team before merging — Backend and Frontend may need to update their code.

---

## MinIO Console (web UI)

Open [http://localhost:9001](http://localhost:9001) — login: `minioadmin` / `minioadmin`

"""
BAVIS — Seed / Fixture Data Script
Workstream D: Data, Storage & Event Schema

Populates 4 demo cameras, 30+ detections, 6 tracks, 9 alerts (all three
states), evidence records and virtual-fence zones so Frontend/Backend
teammates can develop every screen without a live camera or AI pipeline.

Usage:
    python seeds/seed.py           # Insert seed data
    python seeds/seed.py --reset   # Drop all seed data and re-insert (clean demo reset)

Or via Make:
    make seed
    make reset
"""

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# ─── Load env ─────────────────────────────────────────────────────────────────
_env_file = Path(__file__).resolve().parent.parent / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from models import (  # noqa: E402
    Base,
    AuditLog,
    Camera,
    Detection,
    Evidence,
    Alert,
    Track,
    Zone,
    AlertSeverity,
    AlertStatus,
    AuditAction,
    CameraStatus,
    ObjectType,
    ZoneRuleType,
)

# ─── DB setup ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set.\n"
        "Copy .env.example → .env and configure your PostgreSQL connection."
    )

engine = create_engine(DATABASE_URL, echo=False)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _uid() -> str:
    return str(uuid.uuid4())


def _ago(**kwargs) -> datetime:
    """Return a timezone-aware datetime N time units in the past."""
    return datetime.now(timezone.utc) - timedelta(**kwargs)


# ─── Fixture IDs (stable across seed runs for easy cross-referencing) ─────────
CAM_CHECKPOINT  = "00000000-0000-0000-0000-000000000001"
CAM_ROAD        = "00000000-0000-0000-0000-000000000002"
CAM_PERIMETER   = "00000000-0000-0000-0000-000000000003"
CAM_GATE        = "00000000-0000-0000-0000-000000000004"

TRACK_P1  = _uid()
TRACK_P2  = _uid()
TRACK_P3  = _uid()
TRACK_V1  = _uid()
TRACK_V2  = _uid()
TRACK_P4  = _uid()

DET_FENCE_BREACH  = _uid()  # triggers the HIGH alert (virtual fence)
DET_VEHICLE_ANPR  = _uid()  # triggers the MEDIUM alert (vehicle + ANPR)
DET_DWELL         = _uid()  # triggers the LOW alert (dwell time)


# ─── Camera fixtures ──────────────────────────────────────────────────────────

def _cameras() -> list[Camera]:
    return [
        Camera(
            camera_id=CAM_CHECKPOINT,
            name="Border Checkpoint Alpha",
            location_code="SSB-BCP-ALPHA-01",
            stream_url="rtsp://192.168.10.11:554/stream1",
            status=CameraStatus.active,
            configuration={
                "fps": 15,
                "resolution": "1920x1080",
                "night_mode": True,
                "codec": "H.264",
            },
        ),
        Camera(
            camera_id=CAM_ROAD,
            name="Border Road Junction BR-7",
            location_code="SSB-BR7-JCT-01",
            stream_url="rtsp://192.168.10.21:554/stream1",
            status=CameraStatus.active,
            configuration={
                "fps": 25,
                "resolution": "1920x1080",
                "night_mode": True,
                "codec": "H.265",
                "anpr_enabled": True,
            },
        ),
        Camera(
            camera_id=CAM_PERIMETER,
            name="Perimeter Fence North",
            location_code="SSB-PERI-NORTH-03",
            stream_url="rtsp://192.168.10.31:554/stream1",
            status=CameraStatus.active,
            configuration={
                "fps": 10,
                "resolution": "1280x720",
                "night_mode": True,
                "ir_mode": "auto",
            },
        ),
        Camera(
            camera_id=CAM_GATE,
            name="Main Gate Entry",
            location_code="SSB-GATE-MAIN-01",
            stream_url=None,      # offline in demo — tests graceful handling
            status=CameraStatus.maintenance,
            configuration={
                "fps": 20,
                "resolution": "1920x1080",
                "night_mode": False,
            },
        ),
    ]


# ─── Track fixtures ───────────────────────────────────────────────────────────

def _tracks() -> list[Track]:
    # Trajectory: list of [x_norm, y_norm] points (0.0–1.0 relative to frame)
    return [
        Track(
            track_id=TRACK_P1,
            camera_id=CAM_PERIMETER,
            object_class=ObjectType.person,
            start_time=_ago(minutes=35),
            end_time=_ago(minutes=30),
            trajectory_summary=[[0.1, 0.9], [0.2, 0.85], [0.3, 0.8], [0.4, 0.72], [0.5, 0.65]],
            frame_count=75,
        ),
        Track(
            track_id=TRACK_P2,
            camera_id=CAM_CHECKPOINT,
            object_class=ObjectType.person,
            start_time=_ago(hours=2, minutes=10),
            end_time=_ago(hours=2),
            trajectory_summary=[[0.3, 0.4], [0.35, 0.42], [0.4, 0.44], [0.45, 0.5]],
            frame_count=120,
        ),
        Track(
            track_id=TRACK_P3,
            camera_id=CAM_ROAD,
            object_class=ObjectType.person,
            start_time=_ago(hours=4),
            end_time=_ago(hours=3, minutes=55),
            trajectory_summary=[[0.8, 0.3], [0.75, 0.32], [0.7, 0.35]],
            frame_count=45,
        ),
        Track(
            track_id=TRACK_V1,
            camera_id=CAM_ROAD,
            object_class=ObjectType.vehicle,
            start_time=_ago(hours=1),
            end_time=_ago(minutes=55),
            trajectory_summary=[[0.0, 0.5], [0.2, 0.5], [0.4, 0.5], [0.6, 0.5], [0.8, 0.5]],
            frame_count=300,
        ),
        Track(
            track_id=TRACK_V2,
            camera_id=CAM_CHECKPOINT,
            object_class=ObjectType.vehicle,
            start_time=_ago(hours=3),
            end_time=_ago(hours=2, minutes=45),
            trajectory_summary=[[0.05, 0.6], [0.15, 0.6], [0.25, 0.58]],
            frame_count=200,
        ),
        Track(
            track_id=TRACK_P4,
            camera_id=CAM_PERIMETER,
            object_class=ObjectType.person,
            start_time=_ago(minutes=10),
            end_time=None,   # still active
            trajectory_summary=[[0.6, 0.2], [0.62, 0.22]],
            frame_count=30,
        ),
    ]


# ─── Detection fixtures ───────────────────────────────────────────────────────

def _detections(all_tracks: list[Track]) -> list[Detection]:
    track_map = {t.track_id: t for t in all_tracks}

    dets: list[Detection] = []

    # ── Perimeter — person approaching restricted zone (fence breach scenario)
    t = track_map[TRACK_P1]
    waypoints = [
        ([102, 450, 178, 590], 0.91),
        ([145, 440, 215, 580], 0.88),
        ([198, 430, 270, 572], 0.93),
        ([245, 420, 315, 565], 0.90),
        ([310, 410, 380, 560], 0.87),
    ]
    for i, (bbox, conf) in enumerate(waypoints):
        det_id = DET_FENCE_BREACH if i == 4 else _uid()
        dets.append(
            Detection(
                detection_id=det_id,
                camera_id=CAM_PERIMETER,
                track_id=TRACK_P1,
                frame_ts=t.start_time + timedelta(seconds=i * 8),
                object_type=ObjectType.person,
                confidence=conf,
                bbox=bbox,
            )
        )

    # ── Road — vehicle (ANPR scenario)
    t = track_map[TRACK_V1]
    vehicle_frames = [
        ([10, 280, 320, 520], 0.96),
        ([200, 275, 510, 515], 0.94),
        ([390, 270, 700, 510], 0.97),
        ([580, 265, 890, 508], 0.95),
        ([760, 260, 1070, 505], 0.98),
    ]
    for i, (bbox, conf) in enumerate(vehicle_frames):
        det_id = DET_VEHICLE_ANPR if i == 2 else _uid()
        dets.append(
            Detection(
                detection_id=det_id,
                camera_id=CAM_ROAD,
                track_id=TRACK_V1,
                frame_ts=t.start_time + timedelta(seconds=i * 2),
                object_type=ObjectType.vehicle,
                confidence=conf,
                bbox=bbox,
            )
        )

    # ── Checkpoint — person dwell time scenario
    t = track_map[TRACK_P2]
    for i in range(8):
        det_id = DET_DWELL if i == 3 else _uid()
        dets.append(
            Detection(
                detection_id=det_id,
                camera_id=CAM_CHECKPOINT,
                track_id=TRACK_P2,
                frame_ts=t.start_time + timedelta(seconds=i * 15),
                object_type=ObjectType.person,
                confidence=round(0.82 + (i % 3) * 0.04, 2),
                bbox=[480 + i * 5, 200, 570 + i * 5, 450],
            )
        )

    # ── Scatter — misc persons and vehicles across cameras
    scatter = [
        (CAM_CHECKPOINT, TRACK_V2, ObjectType.vehicle, _ago(hours=3), [100, 300, 500, 600], 0.90),
        (CAM_ROAD,       TRACK_P3, ObjectType.person,  _ago(hours=4), [800, 200, 880, 480], 0.85),
        (CAM_PERIMETER,  TRACK_P4, ObjectType.person,  _ago(minutes=10), [600, 100, 680, 370], 0.92),
        (CAM_CHECKPOINT, TRACK_P2, ObjectType.person,  _ago(hours=2, minutes=5), [350, 220, 430, 500], 0.88),
        (CAM_ROAD,       TRACK_V1, ObjectType.vehicle, _ago(hours=1, minutes=2), [900, 260, 1210, 506], 0.97),
    ]
    for cam_id, track_id, obj_type, ts, bbox, conf in scatter:
        dets.append(
            Detection(
                detection_id=_uid(),
                camera_id=cam_id,
                track_id=track_id,
                frame_ts=ts,
                object_type=obj_type,
                confidence=conf,
                bbox=bbox,
            )
        )

    return dets


# ─── Zone fixtures ────────────────────────────────────────────────────────────

def _zones() -> list[Zone]:
    return [
        Zone(
            zone_id=_uid(),
            camera_id=CAM_PERIMETER,
            name="North Perimeter Fence Line",
            rule_type=ZoneRuleType.virtual_fence,
            geometry={
                "type": "LineString",
                "coordinates": [[0.3, 0.7], [0.7, 0.7]],
            },
            threshold=1.0,   # 1 crossing = alert
            is_active=True,
        ),
        Zone(
            zone_id=_uid(),
            camera_id=CAM_CHECKPOINT,
            name="Restricted Inspection Bay",
            rule_type=ZoneRuleType.restricted_area,
            geometry={
                "type": "Polygon",
                "coordinates": [[[0.6, 0.3], [0.9, 0.3], [0.9, 0.8], [0.6, 0.8], [0.6, 0.3]]],
            },
            threshold=None,  # any entry = alert
            is_active=True,
        ),
        Zone(
            zone_id=_uid(),
            camera_id=CAM_CHECKPOINT,
            name="Entry Lane Dwell Zone",
            rule_type=ZoneRuleType.dwell_time,
            geometry={
                "type": "Polygon",
                "coordinates": [[[0.3, 0.1], [0.6, 0.1], [0.6, 0.9], [0.3, 0.9], [0.3, 0.1]]],
            },
            threshold=120.0,  # seconds before dwell alert
            is_active=True,
        ),
        Zone(
            zone_id=_uid(),
            camera_id=CAM_ROAD,
            name="Road Junction Headcount",
            rule_type=ZoneRuleType.headcount,
            geometry={
                "type": "Polygon",
                "coordinates": [[[0.0, 0.4], [1.0, 0.4], [1.0, 0.9], [0.0, 0.9], [0.0, 0.4]]],
            },
            threshold=5.0,  # max 5 persons before alert
            is_active=True,
        ),
    ]


# ─── Alert fixtures ───────────────────────────────────────────────────────────
# 9 alerts — 3× new, 3× acknowledged, 3× resolved — covering all three states

def _alerts() -> list[Alert]:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return [
        # ── NEW alerts (3) ─────────────────────────────────────────────────
        Alert(
            alert_id=_uid(),
            event_id=DET_FENCE_BREACH,
            camera_id=CAM_PERIMETER,
            rule="virtual_fence_breach",
            severity=AlertSeverity.high,
            status=AlertStatus.new,
            description=(
                "Person detected crossing the North Perimeter Fence Line "
                "at 22:47 local time. Track active for 5 frames before crossing."
            ),
            evidence_ref=f"cameras/{CAM_PERIMETER}/snapshots/{date_str}/ev_fence.jpg",
            created_at=_ago(minutes=30),
        ),
        Alert(
            alert_id=_uid(),
            event_id=DET_VEHICLE_ANPR,
            camera_id=CAM_ROAD,
            rule="vehicle_unrecognized_plate",
            severity=AlertSeverity.medium,
            status=AlertStatus.new,
            description=(
                "Vehicle with unregistered/unreadable license plate transited "
                "BR-7 junction. ANPR confidence: 0.62 — plate partially obscured."
            ),
            evidence_ref=f"cameras/{CAM_ROAD}/snapshots/{date_str}/ev_anpr.jpg",
            created_at=_ago(minutes=15),
        ),
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_PERIMETER,
            rule="night_movement_detected",
            severity=AlertSeverity.high,
            status=AlertStatus.new,
            description=(
                "Sustained movement detected in low-light conditions along the "
                "north perimeter sector at 03:12. Multiple frames confirmed."
            ),
            evidence_ref=None,
            created_at=_ago(minutes=5),
        ),

        # ── ACKNOWLEDGED alerts (3) ─────────────────────────────────────────
        Alert(
            alert_id=_uid(),
            event_id=DET_DWELL,
            camera_id=CAM_CHECKPOINT,
            rule="dwell_time_exceeded",
            severity=AlertSeverity.medium,
            status=AlertStatus.acknowledged,
            description=(
                "Person remained stationary in Entry Lane Dwell Zone for > 120 s "
                "(observed 2 min 18 s). Operator review requested."
            ),
            evidence_ref=f"cameras/{CAM_CHECKPOINT}/snapshots/{date_str}/ev_dwell.jpg",
            created_at=_ago(hours=2, minutes=30),
            acknowledged_by="operator_kapoor",
            acknowledged_at=_ago(hours=2, minutes=20),
        ),
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_ROAD,
            rule="headcount_exceeded",
            severity=AlertSeverity.low,
            status=AlertStatus.acknowledged,
            description=(
                "Person count in Road Junction Headcount zone reached 6 (threshold: 5). "
                "Possibly a shift changeover — under observation."
            ),
            evidence_ref=None,
            created_at=_ago(hours=4),
            acknowledged_by="supervisor_mehta",
            acknowledged_at=_ago(hours=3, minutes=55),
        ),
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_PERIMETER,
            rule="virtual_fence_breach",
            severity=AlertSeverity.high,
            status=AlertStatus.acknowledged,
            description=(
                "Second crossing of the North Perimeter Fence Line within 60 minutes. "
                "Direction: outbound. Operator notified."
            ),
            evidence_ref=None,
            created_at=_ago(hours=1, minutes=45),
            acknowledged_by="operator_kapoor",
            acknowledged_at=_ago(hours=1, minutes=40),
        ),

        # ── RESOLVED alerts (3) ─────────────────────────────────────────────
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_CHECKPOINT,
            rule="restricted_area_entry",
            severity=AlertSeverity.high,
            status=AlertStatus.resolved,
            description=(
                "Unauthorised entry into Restricted Inspection Bay. "
                "Incident investigated — maintenance personnel with valid pass. "
                "Resolved after identity verification."
            ),
            evidence_ref=f"cameras/{CAM_CHECKPOINT}/snapshots/{date_str}/ev_restricted.jpg",
            created_at=_ago(hours=6),
            acknowledged_by="supervisor_mehta",
            acknowledged_at=_ago(hours=5, minutes=55),
            resolved_at=_ago(hours=5, minutes=30),
        ),
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_ROAD,
            rule="vehicle_unrecognized_plate",
            severity=AlertSeverity.medium,
            status=AlertStatus.resolved,
            description=(
                "Unrecognised plate at BR-7. Follow-up query to regional registry "
                "confirmed vehicle as civilian supply truck. Closed."
            ),
            evidence_ref=None,
            created_at=_ago(hours=8),
            acknowledged_by="operator_singh",
            acknowledged_at=_ago(hours=7, minutes=50),
            resolved_at=_ago(hours=7),
        ),
        Alert(
            alert_id=_uid(),
            event_id=None,
            camera_id=CAM_PERIMETER,
            rule="night_movement_detected",
            severity=AlertSeverity.low,
            status=AlertStatus.resolved,
            description=(
                "Movement pattern resolved as wildlife (large animal). "
                "No human tracks confirmed. Night patrol dispatched and returned clear."
            ),
            evidence_ref=None,
            created_at=_ago(days=1, hours=2),
            acknowledged_by="supervisor_mehta",
            acknowledged_at=_ago(days=1, hours=1, minutes=50),
            resolved_at=_ago(days=1, hours=1),
        ),
    ]


# ─── Evidence fixtures ────────────────────────────────────────────────────────

def _evidence(alerts_with_refs: list[Alert]) -> list[Evidence]:
    """Create Evidence records for alerts that have an evidence_ref."""
    evs = []
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for alert in alerts_with_refs:
        if alert.evidence_ref:
            evs.append(
                Evidence(
                    evidence_id=_uid(),
                    event_id=alert.alert_id,
                    snapshot_ref=alert.evidence_ref,
                    clip_ref=alert.evidence_ref.replace(
                        "snapshots", "clips"
                    ).replace(".jpg", ".mp4"),
                    retention_metadata={
                        "retain_until": (
                            datetime.now(timezone.utc) + timedelta(days=90)
                        ).isoformat(),
                        "reason": "security_event",
                        "purged": False,
                    },
                    captured_at=alert.created_at,
                )
            )
    return evs


# ─── AuditLog fixtures ────────────────────────────────────────────────────────

def _audit_log(cameras: list[Camera], alerts: list[Alert]) -> list[AuditLog]:
    entries: list[AuditLog] = []
    cam_ids = [c.camera_id for c in cameras]
    alert_ids = [a.alert_id for a in alerts]

    entries += [
        AuditLog(
            actor="operator_kapoor",
            action=AuditAction.login,
            object_ref=None,
            object_type=None,
            result="success",
            detail={"ip": "10.10.1.42"},
            source="10.10.1.42",
            timestamp=_ago(hours=3),
        ),
        AuditLog(
            actor="supervisor_mehta",
            action=AuditAction.login,
            object_ref=None,
            object_type=None,
            result="success",
            detail={"ip": "10.10.1.55"},
            source="10.10.1.55",
            timestamp=_ago(hours=6),
        ),
        AuditLog(
            actor="operator_kapoor",
            action=AuditAction.alert_ack,
            object_ref=alert_ids[3] if len(alert_ids) > 3 else None,
            object_type="alert",
            result="success",
            detail={"note": "Under observation"},
            source="10.10.1.42",
            timestamp=_ago(hours=2, minutes=20),
        ),
        AuditLog(
            actor="supervisor_mehta",
            action=AuditAction.alert_resolve,
            object_ref=alert_ids[6] if len(alert_ids) > 6 else None,
            object_type="alert",
            result="success",
            detail={"resolution": "Maintenance personnel verified with pass"},
            source="10.10.1.55",
            timestamp=_ago(hours=5, minutes=30),
        ),
        AuditLog(
            actor="system",
            action=AuditAction.camera_add,
            object_ref=cam_ids[0],
            object_type="camera",
            result="success",
            detail={"name": "Border Checkpoint Alpha"},
            source="bavis-ingestion-service",
            timestamp=_ago(days=3),
        ),
        AuditLog(
            actor="admin_rao",
            action=AuditAction.zone_create,
            object_ref=None,
            object_type="zone",
            result="success",
            detail={"zone_name": "North Perimeter Fence Line"},
            source="10.10.1.10",
            timestamp=_ago(days=2),
        ),
        AuditLog(
            actor="operator_singh",
            action=AuditAction.evidence_access,
            object_ref=None,
            object_type="evidence",
            result="success",
            detail={"reason": "Incident investigation"},
            source="10.10.1.61",
            timestamp=_ago(hours=7, minutes=45),
        ),
        AuditLog(
            actor="system",
            action=AuditAction.seed_reset,
            object_ref=None,
            object_type=None,
            result="success",
            detail={"script": "seeds/seed.py", "mode": "initial"},
            source="localhost",
            timestamp=_ago(seconds=5),
        ),
    ]
    return entries


# ─── Seed entrypoint ──────────────────────────────────────────────────────────

def seed(reset: bool = False) -> None:
    with Session(engine) as session:
        if reset:
            print("[~] Resetting seed data...")
            # Delete in reverse FK order
            session.execute(text("DELETE FROM audit_log"))
            session.execute(text("DELETE FROM evidence"))
            session.execute(text("DELETE FROM alerts"))
            session.execute(text("DELETE FROM detections"))
            session.execute(text("DELETE FROM tracks"))
            session.execute(text("DELETE FROM zones"))
            session.execute(text("DELETE FROM cameras"))
            session.commit()
            print("[OK] Seed data cleared.")

        print("[+] Inserting cameras...")
        cameras = _cameras()
        session.add_all(cameras)
        session.flush()

        print("[+] Inserting tracks...")
        tracks = _tracks()
        session.add_all(tracks)
        session.flush()

        print("[+] Inserting detections...")
        detections = _detections(tracks)
        session.add_all(detections)
        session.flush()

        print("[+] Inserting zones...")
        zones = _zones()
        session.add_all(zones)
        session.flush()

        print("[+] Inserting alerts...")
        alerts = _alerts()
        session.add_all(alerts)
        session.flush()

        print("[+] Inserting evidence...")
        evidence = _evidence(alerts)
        session.add_all(evidence)
        session.flush()

        print("[+] Inserting audit log...")
        audit_entries = _audit_log(cameras, alerts)
        session.add_all(audit_entries)

        session.commit()

    print(f"""
[OK] Seed complete.

Inserted:
  Cameras    : {len(cameras)} (3 active, 1 maintenance)
  Tracks     : {len(tracks)}
  Detections : {len(detections)}
  Zones      : {len(zones)}
  Alerts     : {len(alerts)} (3 new, 3 acknowledged, 3 resolved)
  Evidence   : {len(evidence)}
  Audit logs : {len(audit_entries)}

Frontend can now render: camera list, live feed placeholders, alert panel
(all 3 states), incident timeline, event search, zone editor.
""")


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="BAVIS seed script — populate demo data for development and demos"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe existing seed data before inserting (safe for demo resets)",
    )
    args = parser.parse_args()
    seed(reset=args.reset)

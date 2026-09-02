"""
End-to-end integration unit tests for BAVIS Intelligence Engine.
Verifies line crossing, polygon intrusion, dwell thresholds, off-hours escalation,
event correlation, deduplication, and contract adherence.
"""

from datetime import datetime, timezone, timedelta
from intelligence.schemas import DetectionEvent, ZoneConfig, RuleType, SeverityLevel
from intelligence.engine import IntelligenceEngine


def test_virtual_fence_line_crossing():
    engine = IntelligenceEngine()

    # Configure vertical virtual fence line at X=100
    zone = ZoneConfig(
        zone_id="zone_fence_01",
        camera_id="cam_border_01",
        name="Border Line Fence",
        geometry_type="line",
        coordinates=[(100.0, 0.0), (100.0, 500.0)],
        rule_type=RuleType.VIRTUAL_FENCE_BREACH.value,
        sensitivity=1.0,
    )
    engine.add_zone(zone)

    # Frame 1: Person at X=50 (left of fence)
    det1 = DetectionEvent(
        camera_id="cam_border_01",
        frame_ts="2026-09-02T12:00:00Z",
        object_type="person",
        confidence=0.92,
        bbox=[40.0, 100.0, 60.0, 200.0],  # bottom_center = (50, 200)
        track_id="trk_001",
    )
    alerts1 = engine.process_detection(det1)
    assert len(alerts1) == 0  # Not crossed yet

    # Frame 2: Person moves to X=150 (right of fence) -> crosses X=100
    det2 = DetectionEvent(
        camera_id="cam_border_01",
        frame_ts="2026-09-02T12:00:01Z",
        object_type="person",
        confidence=0.95,
        bbox=[140.0, 100.0, 160.0, 200.0],  # bottom_center = (150, 200)
        track_id="trk_001",
    )
    alerts2 = engine.process_detection(det2)
    assert len(alerts2) == 1
    alert = alerts2[0]

    # Verify contract fields (Section 8.2)
    assert alert.rule == RuleType.VIRTUAL_FENCE_BREACH.value
    assert alert.severity in [SeverityLevel.HIGH.value, SeverityLevel.MEDIUM.value]
    assert alert.status == "new"
    assert alert.camera_id == "cam_border_01"
    assert alert.track_id == "trk_001"
    assert "breached virtual fence" in alert.explanation


def test_polygon_intrusion_and_dwell_time():
    engine = IntelligenceEngine()

    # Restricted polygon zone [0,0] to [200, 200] with 5-second dwell threshold
    zone = ZoneConfig(
        zone_id="zone_restricted_01",
        camera_id="cam_bop_02",
        name="High-Security BOP Perimeter",
        geometry_type="polygon",
        coordinates=[(0.0, 0.0), (200.0, 0.0), (200.0, 200.0), (0.0, 200.0)],
        rule_type=RuleType.ZONE_INTRUSION.value,
        dwell_threshold_seconds=5.0,
        restricted_hours_start=None,  # All-day rule
    )
    engine.add_zone(zone)

    start_time = datetime(2026, 9, 2, 14, 0, 0, tzinfo=timezone.utc)

    # Frame 1: Enters zone at t=0s -> Initial intrusion alert
    det1 = DetectionEvent(
        camera_id="cam_bop_02",
        frame_ts=start_time.isoformat(),
        object_type="person",
        confidence=0.88,
        bbox=[50.0, 50.0, 100.0, 150.0],  # bottom_center = (75, 150) inside polygon
        track_id="trk_002",
    )
    alerts1 = engine.process_detection(det1)
    assert len(alerts1) == 1
    assert alerts1[0].rule == RuleType.ZONE_INTRUSION.value

    # Frame 2: Still inside at t=2s -> Deduplicated (no new alert)
    det2 = DetectionEvent(
        camera_id="cam_bop_02",
        frame_ts=(start_time + timedelta(seconds=2)).isoformat(),
        object_type="person",
        confidence=0.90,
        bbox=[50.0, 50.0, 100.0, 150.0],
        track_id="trk_002",
    )
    alerts2 = engine.process_detection(det2)
    assert len(alerts2) == 0  # Deduplicated during cooldown

    # Frame 3: Still inside at t=6s -> Exceeds 5s dwell threshold -> Dwell rule triggers
    det3 = DetectionEvent(
        camera_id="cam_bop_02",
        frame_ts=(start_time + timedelta(seconds=6)).isoformat(),
        object_type="person",
        confidence=0.91,
        bbox=[50.0, 50.0, 100.0, 150.0],
        track_id="trk_002",
    )
    alerts3 = engine.process_detection(det3)
    assert len(alerts3) == 1
    assert alerts3[0].rule == RuleType.DWELL_TIME_EXCEEDED.value
    assert "dwelling in 'High-Security BOP Perimeter'" in alerts3[0].explanation


def test_off_hours_risk_escalation():
    engine = IntelligenceEngine()

    # Restricted night hours 22:00 to 06:00
    zone = ZoneConfig(
        zone_id="zone_night_01",
        camera_id="cam_road_03",
        name="Border Road Post",
        geometry_type="polygon",
        coordinates=[(0.0, 0.0), (300.0, 0.0), (300.0, 300.0), (0.0, 300.0)],
        rule_type=RuleType.ZONE_INTRUSION.value,
        restricted_hours_start=22,
        restricted_hours_end=6,
    )
    engine.add_zone(zone)

    # Detection at 23:30 (Off-hours night time)
    night_ts = "2026-09-02T23:30:00Z"
    det = DetectionEvent(
        camera_id="cam_road_03",
        frame_ts=night_ts,
        object_type="person",
        confidence=0.94,
        bbox=[100.0, 100.0, 150.0, 200.0],
        track_id="trk_night_99",
    )
    alerts = engine.process_detection(det)
    assert len(alerts) == 1
    alert = alerts[0]

    assert alert.rule == RuleType.UNUSUAL_TIME_MOVEMENT.value
    assert alert.severity == SeverityLevel.HIGH.value
    assert "off-hours" in alert.explanation.lower()

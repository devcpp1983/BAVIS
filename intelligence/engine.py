"""
Main Intelligence Engine orchestrator for BAVIS.
Consumes DetectionEvents, evaluates zones/rules, computes risk scores, and emits AlertEvents.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from intelligence.schemas import (
    DetectionEvent,
    ZoneConfig,
    AlertEvent,
    RuleType,
    SeverityLevel,
)
from intelligence.config import IntelligenceConfig, DEFAULT_CONFIG
from intelligence.evaluators.geometry import (
    is_point_in_polygon,
    does_segment_cross_line,
    get_anchor_point,
)
from intelligence.evaluators.temporal import TemporalEvaluator, TrackHistory
from intelligence.risk_scoring import RiskScoringEngine
from intelligence.correlator import EventCorrelator


class IntelligenceEngine:
    def __init__(self, config: IntelligenceConfig = DEFAULT_CONFIG):
        self.config = config
        self.zones: Dict[str, ZoneConfig] = {}  # zone_id -> ZoneConfig
        self.track_histories: Dict[str, TrackHistory] = {}  # track_id -> TrackHistory
        self.temporal_evaluator = TemporalEvaluator()
        self.risk_engine = RiskScoringEngine(config=config)
        self.correlator = EventCorrelator(config=config)

    def add_zone(self, zone: ZoneConfig):
        """Registers or updates a zone configuration."""
        self.zones[zone.zone_id] = zone

    def remove_zone(self, zone_id: str):
        """Removes a zone configuration."""
        if zone_id in self.zones:
            del self.zones[zone_id]

    def get_zones_for_camera(self, camera_id: str) -> List[ZoneConfig]:
        """Returns all configured zones for a given camera."""
        return [z for z in self.zones.values() if z.camera_id == camera_id]

    def process_detection(self, detection: DetectionEvent) -> List[AlertEvent]:
        """
        Main entry point: processes a single frame detection event from AI/CV.
        
        :param detection: Ingested DetectionEvent.
        :return: List of triggered AlertEvents (empty if no rules fired or deduplicated).
        """
        alerts: List[AlertEvent] = []
        camera_zones = self.get_zones_for_camera(detection.camera_id)
        if not camera_zones:
            return alerts

        current_dt = detection.timestamp_dt
        curr_pos = get_anchor_point(detection.bbox, anchor="bottom_center")

        # 1. Retrieve or initialize track history
        track_id = detection.track_id
        if track_id not in self.track_histories:
            self.track_histories[track_id] = TrackHistory(
                track_id=track_id,
                camera_id=detection.camera_id,
                object_type=detection.object_type,
                first_seen_ts=current_dt,
                last_seen_ts=current_dt,
            )

        track_hist = self.track_histories[track_id]
        prev_pos = track_hist.current_position
        track_hist.add_observation(current_dt, curr_pos)

        # 2. Evaluate against each zone for this camera
        for zone in camera_zones:
            # Check if object type is allowed in zone
            if zone.allowed_object_types and detection.object_type in zone.allowed_object_types:
                continue

            rule_fired: Optional[str] = None
            dwell_seconds = 0.0

            if zone.geometry_type == "line":
                # Line crossing check
                if prev_pos is not None and len(zone.coordinates) >= 2:
                    line_start = zone.coordinates[0]
                    line_end = zone.coordinates[1]
                    if does_segment_cross_line(prev_pos, curr_pos, line_start, line_end):
                        rule_fired = RuleType.VIRTUAL_FENCE_BREACH.value

            elif zone.geometry_type == "polygon":
                # Polygon intrusion check
                is_inside = is_point_in_polygon(curr_pos, zone.coordinates)
                dwell_seconds = self.temporal_evaluator.update_dwell_state(
                    track_hist, zone, current_dt, is_inside
                )

                if is_inside:
                    # Check dwell threshold vs general intrusion
                    if (
                        zone.dwell_threshold_seconds > 0
                        and dwell_seconds >= zone.dwell_threshold_seconds
                    ):
                        rule_fired = RuleType.DWELL_TIME_EXCEEDED.value
                    else:
                        rule_fired = zone.rule_type or RuleType.ZONE_INTRUSION.value

            if rule_fired:
                is_off_hours = zone.is_hours_restricted(current_dt)

                # Upgrade rule to unusual_time_movement if off-hours
                if is_off_hours and rule_fired == RuleType.ZONE_INTRUSION.value:
                    rule_fired = RuleType.UNUSUAL_TIME_MOVEMENT.value

                # 3. Risk scoring
                score, severity, explanation = self.risk_engine.calculate_risk(
                    rule_type=rule_fired,
                    detection=detection,
                    zone=zone,
                    dwell_seconds=dwell_seconds,
                    is_off_hours=is_off_hours,
                )

                # 4. Correlation & Deduplication check
                should_fire, existing_alert_id = self.correlator.should_fire_alert(
                    track_id=track_id,
                    camera_id=detection.camera_id,
                    zone_id=zone.zone_id,
                    rule_type=rule_fired,
                    severity=severity,
                    current_dt=current_dt,
                )

                if should_fire:
                    alert = AlertEvent(
                        alert_id=existing_alert_id or "",
                        event_id="",
                        severity=severity.value,
                        rule=rule_fired,
                        status="new",
                        created_at=detection.frame_ts,
                        acknowledged_by=None,
                        evidence_ref=f"s3://bavis-evidence/{detection.camera_id}/{current_dt.strftime('%Y%m%d')}/{track_id}.jpg",
                        camera_id=detection.camera_id,
                        track_id=track_id,
                        score=score,
                        explanation=explanation,
                    )
                    
                    self.correlator.register_fired_alert(
                        track_id=track_id,
                        camera_id=detection.camera_id,
                        zone_id=zone.zone_id,
                        rule_type=rule_fired,
                        severity=severity,
                        alert=alert,
                        current_dt=current_dt,
                    )

                    alerts.append(alert)

        return alerts

    def process_detection_batch(self, detections: List[DetectionEvent]) -> List[AlertEvent]:
        """Processes a sequence of detection events across multiple frames."""
        all_alerts: List[AlertEvent] = []
        for det in detections:
            alerts = self.process_detection(det)
            all_alerts.extend(alerts)
        return all_alerts


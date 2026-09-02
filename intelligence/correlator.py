"""
Event Correlator and Alert Deduplication Engine for BAVIS Intelligence.
Merges multi-rule triggers for a track/zone into single explainable alerts.
Prevents false-positive floods and duplicate alerts during ongoing intrusions.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from intelligence.schemas import AlertEvent, SeverityLevel
from intelligence.config import IntelligenceConfig, DEFAULT_CONFIG


@dataclass
class TrackAlertRecord:
    """Records alert state for an ongoing track in a specific zone."""
    track_id: str
    camera_id: str
    zone_id: str
    last_alert_ts: datetime
    active_alert_id: str
    highest_severity: SeverityLevel
    fired_rules: List[str] = field(default_factory=list)


class EventCorrelator:
    def __init__(self, config: IntelligenceConfig = DEFAULT_CONFIG):
        self.config = config
        # Key: (track_id, zone_id) -> TrackAlertRecord
        self.active_alerts: Dict[str, TrackAlertRecord] = {}

    def should_fire_alert(
        self,
        track_id: str,
        camera_id: str,
        zone_id: str,
        rule_type: str,
        severity: SeverityLevel,
        current_dt: datetime,
    ) -> Tuple[bool, Optional[str]]:
        """
        Determines whether a new alert should be emitted, or if it should be deduplicated / merged.
        
        :return: Tuple of (should_fire: bool, existing_alert_id: Optional[str])
        """
        key = f"{track_id}:{zone_id}"
        record = self.active_alerts.get(key)

        if record is None:
            # First alert for this track in this zone
            return (True, None)

        elapsed = (current_dt - record.last_alert_ts).total_seconds()

        # Check if a new rule type fired for this track in this zone (e.g., ZONE_INTRUSION -> DWELL_TIME_EXCEEDED)
        if rule_type not in record.fired_rules:
            return (True, record.active_alert_id)

        # Check if severity escalated (e.g. MEDIUM -> HIGH)
        if self._is_severity_higher(severity, record.highest_severity):
            return (True, record.active_alert_id)

        # Check if cooldown period expired
        if elapsed >= self.config.alert_cooldown_seconds:
            return (True, record.active_alert_id)

        # Otherwise deduplicate/suppress duplicate alert
        return (False, record.active_alert_id)

    def register_fired_alert(
        self,
        track_id: str,
        camera_id: str,
        zone_id: str,
        rule_type: str,
        severity: SeverityLevel,
        alert: AlertEvent,
        current_dt: datetime,
    ):
        """Updates internal record of active alerts for track."""
        key = f"{track_id}:{zone_id}"
        record = self.active_alerts.get(key)

        if record is None:
            self.active_alerts[key] = TrackAlertRecord(
                track_id=track_id,
                camera_id=camera_id,
                zone_id=zone_id,
                last_alert_ts=current_dt,
                active_alert_id=alert.alert_id,
                highest_severity=severity,
                fired_rules=[rule_type],
            )
        else:
            record.last_alert_ts = current_dt
            if self._is_severity_higher(severity, record.highest_severity):
                record.highest_severity = severity
            if rule_type not in record.fired_rules:
                record.fired_rules.append(rule_type)

    def cleanup_inactive_tracks(self, active_track_ids: List[str]):
        """Cleans up alert history for tracks that have left all camera feeds."""
        keys_to_delete = [
            key for key, record in self.active_alerts.items()
            if record.track_id not in active_track_ids
        ]
        for key in keys_to_delete:
            del self.active_alerts[key]

    def _is_severity_higher(self, new_sev: SeverityLevel, old_sev: SeverityLevel) -> bool:
        order = {SeverityLevel.LOW: 1, SeverityLevel.MEDIUM: 2, SeverityLevel.HIGH: 3}
        return order.get(new_sev, 0) > order.get(old_sev, 0)

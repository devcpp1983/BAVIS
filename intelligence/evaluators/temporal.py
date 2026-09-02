"""
Temporal and stateful evaluators for BAVIS Intelligence Engine.
Tracks dwell durations, track history, and restricted hours.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from intelligence.schemas import DetectionEvent, ZoneConfig
from intelligence.evaluators.geometry import is_point_in_polygon, get_anchor_point


@dataclass
class TrackHistory:
    """Tracks state history across frames for a single track_id."""
    track_id: str
    camera_id: str
    object_type: str
    first_seen_ts: datetime
    last_seen_ts: datetime
    positions: List[Tuple[datetime, Tuple[float, float]]] = field(default_factory=list)
    zone_entry_timestamps: Dict[str, datetime] = field(default_factory=dict)  # zone_id -> entry_dt

    def add_observation(self, dt: datetime, position: Tuple[float, float]):
        self.last_seen_ts = dt
        self.positions.append((dt, position))
        # Maintain sliding window of 150 points
        if len(self.positions) > 150:
            self.positions.pop(0)

    @property
    def current_position(self) -> Optional[Tuple[float, float]]:
        if not self.positions:
            return None
        return self.positions[-1][1]

    @property
    def previous_position(self) -> Optional[Tuple[float, float]]:
        if len(self.positions) < 2:
            return None
        return self.positions[-2][1]


class TemporalEvaluator:
    """Evaluates dwell duration and time window constraints for active tracks."""

    def update_dwell_state(
        self, track_history: TrackHistory, zone: ZoneConfig, current_dt: datetime, is_inside: bool
    ) -> float:
        """
        Updates zone entry timestamp and returns current dwell duration in seconds inside the zone.
        """
        zone_id = zone.zone_id

        if is_inside:
            if zone_id not in track_history.zone_entry_timestamps:
                track_history.zone_entry_timestamps[zone_id] = current_dt
            
            entry_dt = track_history.zone_entry_timestamps[zone_id]
            dwell_seconds = (current_dt - entry_dt).total_seconds()
            return max(0.0, dwell_seconds)
        else:
            # Left zone -> clear entry timestamp
            if zone_id in track_history.zone_entry_timestamps:
                del track_history.zone_entry_timestamps[zone_id]
            return 0.0

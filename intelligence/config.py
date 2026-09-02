"""
Declarative configuration for BAVIS Intelligence Engine.
Keeps scoring weights, thresholds, and timers tunable without redeploy.
"""

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class IntelligenceConfig:
    # Deduplication / Cooldown (seconds) per track_id per rule
    alert_cooldown_seconds: float = 30.0
    
    # Track position memory history limit
    max_track_history_length: int = 150
    
    # Severity Thresholds (0.0 to 1.0)
    severity_low_threshold: float = 0.40
    severity_medium_threshold: float = 0.70
    
    # Base risk weights
    rule_base_weights: Dict[str, float] = field(default_factory=lambda: {
        "virtual_fence_breach": 0.85,
        "zone_intrusion": 0.65,
        "dwell_time_exceeded": 0.70,
        "unusual_time_movement": 0.60,
    })
    
    # Object class multipliers
    object_class_multipliers: Dict[str, float] = field(default_factory=lambda: {
        "person": 1.2,
        "vehicle": 1.0,
        "face": 1.1,
    })
    
    # Time window multiplier for restricted/off-hours
    off_hours_multiplier: float = 1.35
    
    # Dwell time weight per 10 seconds inside zone
    dwell_score_factor: float = 0.05  # Adds +0.05 per 10 seconds, capped at +0.3
    max_dwell_score_bonus: float = 0.30


DEFAULT_CONFIG = IntelligenceConfig()

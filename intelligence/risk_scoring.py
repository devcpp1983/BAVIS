"""
Explainable Risk Scoring Engine for BAVIS Intelligence Engine.
Computes numerical score [0.0 - 1.0] and maps to severity rating ('low' | 'medium' | 'high').
Generates concise human-readable explanations for security operators and hackathon judges.
"""

from typing import Tuple, Dict, Any
from intelligence.schemas import SeverityLevel, RuleType, DetectionEvent, ZoneConfig
from intelligence.config import IntelligenceConfig, DEFAULT_CONFIG


class RiskScoringEngine:
    def __init__(self, config: IntelligenceConfig = DEFAULT_CONFIG):
        self.config = config

    def calculate_risk(
        self,
        rule_type: str,
        detection: DetectionEvent,
        zone: ZoneConfig,
        dwell_seconds: float = 0.0,
        is_off_hours: bool = False,
    ) -> Tuple[float, SeverityLevel, str]:
        """
        Computes composite risk score, severity level, and explanation string.
        
        :return: Tuple of (score: float, severity: SeverityLevel, explanation: str)
        """
        # 1. Base rule weight
        base_weight = self.config.rule_base_weights.get(rule_type, 0.50)

        # 2. Object class multiplier
        obj_mult = self.config.object_class_multipliers.get(detection.object_type, 1.0)

        # 3. Zone sensitivity
        zone_sens = zone.sensitivity

        # 4. Confidence scaling factor (0.5 to 1.0 mapped to 0.75 to 1.0)
        conf_factor = 0.75 + (0.25 * max(0.0, min(1.0, detection.confidence)))

        # 5. Dwell bonus
        dwell_bonus = min(
            self.config.max_dwell_score_bonus,
            (dwell_seconds / 10.0) * self.config.dwell_score_factor,
        )

        # 6. Off-hours multiplier
        hours_mult = self.config.off_hours_multiplier if is_off_hours else 1.0

        # Calculate combined score
        raw_score = (base_weight * obj_mult * zone_sens * hours_mult * conf_factor) + dwell_bonus

        # Normalize score to [0.0, 1.0]
        final_score = max(0.0, min(1.0, raw_score))

        # Determine severity level
        if final_score >= self.config.severity_medium_threshold:
            severity = SeverityLevel.HIGH
        elif final_score >= self.config.severity_low_threshold:
            severity = SeverityLevel.MEDIUM
        else:
            severity = SeverityLevel.LOW

        # Generate human-readable explanation
        explanation = self._build_explanation(
            rule_type=rule_type,
            detection=detection,
            zone=zone,
            dwell_seconds=dwell_seconds,
            is_off_hours=is_off_hours,
            severity=severity,
            final_score=final_score,
        )

        return (final_score, severity, explanation)

    def _build_explanation(
        self,
        rule_type: str,
        detection: DetectionEvent,
        zone: ZoneConfig,
        dwell_seconds: float,
        is_off_hours: bool,
        severity: SeverityLevel,
        final_score: float,
    ) -> str:
        parts = []

        obj_str = detection.object_type.capitalize()
        parts.append(f"{obj_str} (Track #{detection.track_id}, conf {detection.confidence:.0%})")

        if rule_type == RuleType.VIRTUAL_FENCE_BREACH.value:
            parts.append(f"breached virtual fence in '{zone.name}'")
        elif rule_type == RuleType.DWELL_TIME_EXCEEDED.value:
            parts.append(f"dwelling in '{zone.name}' for {dwell_seconds:.1f}s (threshold {zone.dwell_threshold_seconds:.0f}s)")
        elif rule_type == RuleType.UNUSUAL_TIME_MOVEMENT.value:
            parts.append(f"detected in restricted zone '{zone.name}' during off-hours")
        else:
            parts.append(f"entered restricted zone '{zone.name}'")

        if is_off_hours and rule_type != RuleType.UNUSUAL_TIME_MOVEMENT.value:
            parts.append("during restricted off-hours window")

        if dwell_seconds > 0 and rule_type != RuleType.DWELL_TIME_EXCEEDED.value:
            parts.append(f"sustained dwell time {dwell_seconds:.1f}s")

        return f"[{severity.value.upper()} RISK | Score {final_score:.2f}] " + ", ".join(parts) + "."

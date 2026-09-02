"""
Database adapter for BAVIS Intelligence Engine.
Reads zone configurations from PostgreSQL and persists generated Alert records.
Matches Workstream D database schema (`Zone` and `Alert` tables).
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from intelligence.schemas import ZoneConfig, AlertEvent, DetectionEvent

logger = logging.getLogger("bavis.intelligence.db")


class DatabaseAdapter:
    """
    Handles persistence layer for Intelligence Engine.
    Supports PostgreSQL (via psycopg2/asyncpg/sqlalchemy if available) with in-memory fallback.
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv("DATABASE_URL", "postgresql://bavis:bavis@localhost:5432/bavis_db")
        self.in_memory_alerts: List[AlertEvent] = []
        self.in_memory_zones: Dict[str, ZoneConfig] = {}
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        """Attempts database connection using available drivers."""
        try:
            import psycopg2
            self.conn = psycopg2.connect(self.db_url)
            self.is_connected = True
            logger.info("Connected to PostgreSQL database for Intelligence Engine.")
        except Exception as e:
            logger.warning(f"PostgreSQL connection unavailable ({e}). Using memory fallback mode.")
            self.is_connected = False

    def load_zones_from_db(self, camera_id: Optional[str] = None) -> List[ZoneConfig]:
        """Loads configured zones from PostgreSQL 'zones' table or in-memory fallback."""
        if not self.is_connected:
            zones = list(self.in_memory_zones.values())
            if camera_id:
                return [z for z in zones if z.camera_id == camera_id]
            return zones

        try:
            with self.conn.cursor() as cur:
                query = "SELECT zone_id, camera_id, name, geometry_type, coordinates, rule_type, sensitivity, dwell_threshold_seconds, restricted_hours_start, restricted_hours_end FROM zones"
                params = []
                if camera_id:
                    query += " WHERE camera_id = %s"
                    params.append(camera_id)
                cur.execute(query, params)
                rows = cur.fetchall()

                zones = []
                for row in rows:
                    coords = json.loads(row[4]) if isinstance(row[4], str) else row[4]
                    zones.append(
                        ZoneConfig(
                            zone_id=row[0],
                            camera_id=row[1],
                            name=row[2],
                            geometry_type=row[3],
                            coordinates=coords,
                            rule_type=row[5],
                            sensitivity=float(row[6]),
                            dwell_threshold_seconds=float(row[7]),
                            restricted_hours_start=row[8],
                            restricted_hours_end=row[9],
                        )
                    )
                return zones
        except Exception as e:
            logger.error(f"Error reading zones from DB: {e}")
            return list(self.in_memory_zones.values())

    def save_alert_to_db(self, alert: AlertEvent) -> bool:
        """Persists generated AlertEvent record to PostgreSQL 'alerts' table."""
        self.in_memory_alerts.append(alert)

        if not self.is_connected:
            return True

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO alerts (alert_id, event_id, severity, rule, status, created_at, acknowledged_by, evidence_ref, camera_id, track_id, score, explanation)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (alert_id) DO UPDATE SET
                    severity = EXCLUDED.severity,
                    score = EXCLUDED.score,
                    explanation = EXCLUDED.explanation
                    """,
                    (
                        alert.alert_id,
                        alert.event_id,
                        alert.severity,
                        alert.rule,
                        alert.status,
                        alert.created_at,
                        alert.acknowledged_by,
                        alert.evidence_ref,
                        alert.camera_id,
                        alert.track_id,
                        alert.score,
                        alert.explanation,
                    ),
                )
                self.conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error persisting alert to DB: {e}")
            return False

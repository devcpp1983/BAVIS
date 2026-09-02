"""Initial BAVIS schema — all 7 core tables

Revision ID: 0001
Revises: (none — first migration)
Create Date: 2026-09-02

Tables created:
  - cameras
  - tracks
  - detections
  - alerts
  - evidence
  - zones
  - audit_log

Enum types created:
  - camera_status_enum
  - object_type_enum
  - alert_severity_enum
  - alert_status_enum
  - zone_rule_type_enum
  - audit_action_enum
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

# ─── Revision identifiers ─────────────────────────────────────────────────────
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ─── Upgrade ──────────────────────────────────────────────────────────────────

def upgrade() -> None:
    # ── 1. Create Enum types explicitly ─────────────────────────────────────────
    camera_status_enum = PG_ENUM("active", "inactive", "maintenance", name="camera_status_enum")
    camera_status_enum.create(op.get_bind(), checkfirst=True)

    object_type_enum = PG_ENUM("person", "vehicle", "face", "unknown", name="object_type_enum")
    object_type_enum.create(op.get_bind(), checkfirst=True)

    alert_severity_enum = PG_ENUM("low", "medium", "high", name="alert_severity_enum")
    alert_severity_enum.create(op.get_bind(), checkfirst=True)

    alert_status_enum = PG_ENUM("new", "acknowledged", "resolved", name="alert_status_enum")
    alert_status_enum.create(op.get_bind(), checkfirst=True)

    zone_rule_type_enum = PG_ENUM(
        "virtual_fence", "restricted_area", "dwell_time", "headcount",
        name="zone_rule_type_enum",
    )
    zone_rule_type_enum.create(op.get_bind(), checkfirst=True)

    audit_action_enum = PG_ENUM(
        "login", "logout",
        "alert_ack", "alert_resolve",
        "zone_create", "zone_update", "zone_delete",
        "evidence_access",
        "camera_add", "camera_update",
        "seed_reset",
        name="audit_action_enum",
    )
    audit_action_enum.create(op.get_bind(), checkfirst=True)

    # ── 2. Create tables using existing Enum types ────────────────────────────────
    # Note: Column(index=True) automatically creates the index on create_table.
    op.create_table(
        "cameras",
        sa.Column("camera_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("location_code", sa.String(64), nullable=False, index=True),
        sa.Column("stream_url", sa.String(512), nullable=True),
        sa.Column(
            "status",
            PG_ENUM("active", "inactive", "maintenance", name="camera_status_enum", create_type=False),
            nullable=False,
            server_default="active",
        ),
        sa.Column("configuration", postgresql.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── tracks ──────────────────────────────────────────────────────────────
    op.create_table(
        "tracks",
        sa.Column("track_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "camera_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("cameras.camera_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "object_class",
            PG_ENUM("person", "vehicle", "face", "unknown", name="object_type_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trajectory_summary", postgresql.JSON, nullable=True),
        sa.Column("frame_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── detections ──────────────────────────────────────────────────────────
    op.create_table(
        "detections",
        sa.Column("detection_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "camera_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("cameras.camera_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "track_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("tracks.track_id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("frame_ts", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column(
            "object_type",
            PG_ENUM("person", "vehicle", "face", "unknown", name="object_type_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("confidence", sa.Float, nullable=False),
        sa.Column("bbox", postgresql.JSON, nullable=False),  # [x1, y1, x2, y2]
    )

    # ── alerts ──────────────────────────────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column("alert_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "event_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("detections.detection_id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "camera_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("cameras.camera_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("rule", sa.String(128), nullable=False),
        sa.Column(
            "severity",
            PG_ENUM("low", "medium", "high", name="alert_severity_enum", create_type=False),
            nullable=False,
            server_default="medium",
        ),
        sa.Column(
            "status",
            PG_ENUM("new", "acknowledged", "resolved", name="alert_status_enum", create_type=False),
            nullable=False,
            server_default="new",
            index=True,
        ),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("evidence_ref", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            index=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("acknowledged_by", sa.String(128), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── evidence ────────────────────────────────────────────────────────────
    op.create_table(
        "evidence",
        sa.Column("evidence_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "event_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("alerts.alert_id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("snapshot_ref", sa.String(512), nullable=True),
        sa.Column("clip_ref", sa.String(512), nullable=True),
        sa.Column("retention_metadata", postgresql.JSON, nullable=True),
        sa.Column(
            "captured_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── zones ───────────────────────────────────────────────────────────────
    op.create_table(
        "zones",
        sa.Column("zone_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "camera_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("cameras.camera_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column(
            "rule_type",
            PG_ENUM(
                "virtual_fence", "restricted_area", "dwell_time", "headcount",
                name="zone_rule_type_enum", create_type=False,
            ),
            nullable=False,
            server_default="virtual_fence",
        ),
        sa.Column("geometry", postgresql.JSON, nullable=False),
        sa.Column("threshold", sa.Float, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── audit_log ───────────────────────────────────────────────────────────
    op.create_table(
        "audit_log",
        sa.Column("log_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("actor", sa.String(128), nullable=False, index=True),
        sa.Column(
            "action",
            PG_ENUM(
                "login", "logout",
                "alert_ack", "alert_resolve",
                "zone_create", "zone_update", "zone_delete",
                "evidence_access",
                "camera_add", "camera_update",
                "seed_reset",
                name="audit_action_enum", create_type=False,
            ),
            nullable=False,
            index=True,
        ),
        sa.Column("object_ref", sa.String(512), nullable=True),
        sa.Column("object_type", sa.String(64), nullable=True),
        sa.Column("result", sa.String(32), nullable=False, server_default="success"),
        sa.Column("detail", postgresql.JSON, nullable=True),
        sa.Column("source", sa.String(128), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            index=True,
        ),
    )


# ─── Downgrade ────────────────────────────────────────────────────────────────

def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("zones")
    op.drop_table("evidence")
    op.drop_table("alerts")
    op.drop_table("detections")
    op.drop_table("tracks")
    op.drop_table("cameras")

    # Drop enum types in reverse dependency order
    for enum_name in [
        "audit_action_enum",
        "zone_rule_type_enum",
        "alert_status_enum",
        "alert_severity_enum",
        "object_type_enum",
        "camera_status_enum",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")

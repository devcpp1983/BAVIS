"""
BAVIS — MinIO / S3 Evidence Storage Setup
Workstream D: Data, Storage & Event Schema

Creates the evidence bucket and verifies the layout used by all BAVIS services:

    bavis-evidence/
    └── cameras/
        └── <camera_id>/
            ├── snapshots/
            │   └── <YYYY-MM-DD>/
            │       └── <evidence_id>.jpg
            └── clips/
                └── <YYYY-MM-DD>/
                    └── <evidence_id>.mp4

Run directly:  python minio_setup/setup_buckets.py
Or via Make:   make minio-setup
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from minio import Minio
from minio.error import S3Error

# ─── Load env ─────────────────────────────────────────────────────────────────
_env_file = Path(__file__).resolve().parent.parent / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

MINIO_ENDPOINT  = os.environ.get("MINIO_ENDPOINT",  "localhost:9000")
MINIO_ACCESS    = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET    = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET    = os.environ.get("MINIO_BUCKET",     "bavis-evidence")
MINIO_SECURE    = os.environ.get("MINIO_SECURE", "false").lower() == "true"


# ─── Bucket lifecycle policy (JSON) ───────────────────────────────────────────
# Retains objects for 90 days by default; adjustable per-camera via retention_metadata
_LIFECYCLE_POLICY = """{
  "Rules": [
    {
      "ID": "default-retention",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      },
      "Filter": {
        "Prefix": ""
      }
    }
  ]
}"""


def setup_minio() -> None:
    client = Minio(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS,
        secret_key=MINIO_SECRET,
        secure=MINIO_SECURE,
    )

    # ── Create bucket if it doesn't exist ──────────────────────────────────
    try:
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
            print(f"[+] Created bucket: {MINIO_BUCKET}")
        else:
            print(f"[~] Bucket already exists: {MINIO_BUCKET}")
    except S3Error as exc:
        print(f"[!] Failed to create bucket: {exc}", file=sys.stderr)
        sys.exit(1)

    # ── Apply lifecycle / retention policy ─────────────────────────────────
    try:
        from minio.lifecycleconfig import LifecycleConfig, Rule, Expiration, Filter
        lifecycle = LifecycleConfig(
            [
                Rule(
                    rule_filter=Filter(prefix=""),
                    rule_id="default-retention-90d",
                    status="Enabled",
                    expiration=Expiration(days=90),
                )
            ]
        )
        client.set_bucket_lifecycle(MINIO_BUCKET, lifecycle)
        print(f"[+] Lifecycle policy set: 90-day default retention on '{MINIO_BUCKET}'")
    except Exception as exc:
        # Lifecycle config is a best-effort enhancement; don't abort if it fails
        print(f"[~] Lifecycle policy skipped (non-fatal): {exc}")

    # ── Upload placeholder README to document the folder structure ──────────
    import io
    readme_content = (
        "# BAVIS Evidence Storage\n\n"
        "## Folder Structure\n\n"
        "```\n"
        "bavis-evidence/\n"
        "└── cameras/\n"
        "    └── <camera_id>/\n"
        "        ├── snapshots/\n"
        "        │   └── <YYYY-MM-DD>/\n"
        "        │       └── <evidence_id>.jpg\n"
        "        └── clips/\n"
        "            └── <YYYY-MM-DD>/\n"
        "                └── <evidence_id>.mp4\n"
        "```\n\n"
        "## Path convention\n\n"
        "| Type     | Path pattern |\n"
        "|----------|--------------|\n"
        "| Snapshot | `cameras/{camera_id}/snapshots/{YYYY-MM-DD}/{evidence_id}.jpg` |\n"
        "| Clip     | `cameras/{camera_id}/clips/{YYYY-MM-DD}/{evidence_id}.mp4` |\n\n"
        "## Retention\n\n"
        "Default lifecycle: 90 days.  "
        "Override per-evidence via the `retention_metadata` field in the `evidence` DB table.\n"
    )
    readme_bytes = readme_content.encode()
    client.put_object(
        MINIO_BUCKET,
        "README.md",
        io.BytesIO(readme_bytes),
        length=len(readme_bytes),
        content_type="text/markdown",
    )
    print(f"[+] Uploaded folder-structure README to '{MINIO_BUCKET}/README.md'")

    print("\n[OK] MinIO setup complete.")
    print(f"    Bucket : {MINIO_BUCKET}")
    print(f"    Endpoint: {MINIO_ENDPOINT}")
    print(
        "\nPath convention:\n"
        "  Snapshot: cameras/<camera_id>/snapshots/<YYYY-MM-DD>/<evidence_id>.jpg\n"
        "  Clip    : cameras/<camera_id>/clips/<YYYY-MM-DD>/<evidence_id>.mp4\n"
    )


def build_snapshot_path(camera_id: str, evidence_id: str, date_str: str) -> str:
    """Return the MinIO object path for a snapshot."""
    return f"cameras/{camera_id}/snapshots/{date_str}/{evidence_id}.jpg"


def build_clip_path(camera_id: str, evidence_id: str, date_str: str) -> str:
    """Return the MinIO object path for a video clip."""
    return f"cameras/{camera_id}/clips/{date_str}/{evidence_id}.mp4"


if __name__ == "__main__":
    setup_minio()

import os
import sys
import asyncio
import logging

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.models.domain import User, Camera, Zone, Alert
from app.core.security import get_password_hash
from scripts.generate_demo_video import generate_demo_videos

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bavis.seed")


async def seed_database():
    # Ensure demo video files exist
    generate_demo_videos()

    # Create tables if using direct DB initialization
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Users if not present
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            logger.info("Seeding initial RBAC Users (admin, supervisor, operator)...")
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            supervisor_user = User(
                username="supervisor",
                hashed_password=get_password_hash("super123"),
                role="supervisor"
            )
            operator_user = User(
                username="operator",
                hashed_password=get_password_hash("op123"),
                role="operator"
            )
            db.add_all([admin_user, supervisor_user, operator_user])

        # 2. Seed Cameras
        cam_result = await db.execute(select(Camera))
        if not cam_result.scalars().first():
            logger.info("Seeding Demo Cameras...")
            cams = [
                Camera(
                    camera_id="CAM-BOP-01",
                    name="BOP Sector Alpha North",
                    location_code="BOP-ALPHA-01",
                    stream_url="https://10.152.25.172:8080",
                    status="online",
                    configuration={"fps": 25, "resolution": "1080p", "ptz": False}
                ),
                Camera(
                    camera_id="CAM-BOP-02",
                    name="Patrol Route Bravo",
                    location_code="BOP-BRAVO-04",
                    stream_url="./data/videos/cam2.mp4",
                    status="online",
                    configuration={"fps": 25, "resolution": "720p", "ptz": True}
                ),
                Camera(
                    camera_id="CAM-CHECKPOST-01",
                    name="Main International Checkpost",
                    location_code="CHK-MAIN-01",
                    stream_url="./data/videos/cam3.mp4",
                    status="online",
                    configuration={"fps": 30, "resolution": "4K", "ptz": True}
                ),
                Camera(
                    camera_id="CAM-ROAD-NORTH",
                    name="North Perimeter Highway",
                    location_code="RD-NORTH-08",
                    stream_url="./data/videos/cam4.mp4",
                    status="online",
                    configuration={"fps": 25, "resolution": "1080p", "ptz": False}
                )
            ]
            db.add_all(cams)

        # 3. Seed Restricted Virtual Zones
        zone_result = await db.execute(select(Zone))
        if not zone_result.scalars().first():
            logger.info("Seeding Initial Virtual Fence Zones...")
            zones = [
                Zone(
                    zone_id="ZONE-FENCE-01",
                    camera_id="CAM-BOP-01",
                    name="Zero Line Restricted Buffer",
                    geometry={
                        "type": "Polygon",
                        "coordinates": [[[100, 250], [540, 250], [540, 320], [100, 320]]]
                    },
                    rule_type="virtual_fence",
                    threshold={"dwell_seconds": 3, "min_confidence": 0.85}
                ),
                Zone(
                    zone_id="ZONE-CHECKPOST-01",
                    camera_id="CAM-CHECKPOST-01",
                    name="Vehicle Inspection Bay Line",
                    geometry={
                        "type": "LineString",
                        "coordinates": [[50, 200], [600, 200]]
                    },
                    rule_type="intrusion",
                    threshold={"min_confidence": 0.80}
                )
            ]
            db.add_all(zones)

        await db.commit()
        logger.info("Database seeding completed cleanly.")


if __name__ == "__main__":
    asyncio.run(seed_database())

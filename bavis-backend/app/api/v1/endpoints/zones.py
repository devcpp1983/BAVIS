from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Zone, User
from app.schemas.contract import ZoneOut, ZoneCreate
from app.api.deps import require_operator, require_supervisor

router = APIRouter()


@router.get("", response_model=List[ZoneOut])
async def list_zones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Zone)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
async def create_or_update_zone(
    zone_in: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    zone = Zone(
        camera_id=zone_in.camera_id,
        name=zone_in.name or "Restricted Border Zone",
        geometry=zone_in.geometry,
        rule_type=zone_in.rule_type,
        threshold=zone_in.threshold or {}
    )
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone

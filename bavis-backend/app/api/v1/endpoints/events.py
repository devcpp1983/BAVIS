from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Detection, User
from app.schemas.contract import SecurityEventOut
from app.api.deps import require_operator

router = APIRouter()


@router.get("", response_model=List[SecurityEventOut])
async def search_events(
    camera: Optional[str] = Query(None, description="Filter by camera_id"),
    type: Optional[str] = Query(None, description="Filter by object_type (person, vehicle, face)"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Detection).order_by(Detection.frame_ts.desc()).limit(limit)

    if camera:
        stmt = stmt.where(Detection.camera_id == camera)
    if type:
        stmt = stmt.where(Detection.object_type == type)

    result = await db.execute(stmt)
    return result.scalars().all()

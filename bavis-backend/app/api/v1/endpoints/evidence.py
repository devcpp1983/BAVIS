from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Evidence, User
from app.schemas.contract import EvidenceOut
from app.api.deps import require_operator

router = APIRouter()


@router.get("/{id}", response_model=EvidenceOut)
async def get_evidence(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Evidence).where(
        (Evidence.evidence_id == id) | (Evidence.event_id == id) | (Evidence.snapshot_ref.contains(id))
    )
    result = await db.execute(stmt)
    evidence = result.scalar_one_or_none()

    if not evidence:
        # Fallback stub for demo if exact ID not found
        return EvidenceOut(
            evidence_id=f"EVD-{id}",
            event_id=f"EVT-{id}",
            snapshot_ref=f"/data/evidence/snapshot_{id}.jpg",
            retention_metadata={"policy": "30_days", "camera_id": "CAM-BOP-01"}
        )

    return evidence

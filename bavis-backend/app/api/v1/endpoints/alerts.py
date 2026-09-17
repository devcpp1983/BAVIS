from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Alert, AuditLog, User
from app.schemas.contract import AlertEvent, AlertAckRequest
from app.api.deps import require_operator

router = APIRouter()


@router.get("", response_model=List[AlertEvent])
async def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: new | acknowledged | resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: low | medium | high"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Alert).order_by(Alert.created_at.desc()).limit(limit)

    if status:
        stmt = stmt.where(Alert.status == status)
    if severity:
        stmt = stmt.where(Alert.severity == severity)

    result = await db.execute(stmt)
    alerts = result.scalars().all()

    # Format ISO 8601 created_at strings
    response = []
    for a in alerts:
        response.append(
            AlertEvent(
                alert_id=a.alert_id,
                event_id=a.event_id,
                severity=a.severity,
                rule=a.rule,
                status=a.status,
                created_at=a.created_at.isoformat() + "Z" if isinstance(a.created_at, datetime) else str(a.created_at),
                acknowledged_by=a.acknowledged_by,
                evidence_ref=a.evidence_ref,
                camera_id=getattr(a, "camera_id", None) or "CAM-BOP-01"
            )
        )
    return response


@router.post("/{id}/ack", response_model=AlertEvent)
async def acknowledge_alert(
    id: str,
    ack_data: Optional[AlertAckRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Alert).where(Alert.alert_id == id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    ack_user = current_user.username
    if ack_data and ack_data.acknowledged_by:
        ack_user = ack_data.acknowledged_by

    alert.status = "acknowledged"
    alert.acknowledged_by = ack_user

    # Add audit log entry
    audit = AuditLog(
        actor=ack_user,
        action="ACKNOWLEDGE_ALERT",
        object=f"Alert:{alert.alert_id}",
        result="SUCCESS",
        source="backend-api"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(alert)

    return AlertEvent(
        alert_id=alert.alert_id,
        event_id=alert.event_id,
        severity=alert.severity,
        rule=alert.rule,
        status=alert.status,
        created_at=alert.created_at.isoformat() + "Z" if isinstance(alert.created_at, datetime) else str(alert.created_at),
        acknowledged_by=alert.acknowledged_by,
        evidence_ref=alert.evidence_ref,
        camera_id=getattr(alert, "camera_id", None) or "CAM-BOP-01"
    )


@router.post("", response_model=AlertEvent)
@router.post("/internal", response_model=AlertEvent)
@router.post("/internal/alerts", response_model=AlertEvent)
async def receive_internal_alert(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Internal endpoint called by Intelligence Engine to record a rule breach alert.
    Persists alert & evidence to DB and broadcasts in real-time over WebSocket.
    """
    from app.models.domain import Alert, Evidence
    from app.services.alert_service import alert_broadcaster
    from app.services.webhook import trigger_c2_webhook
    import asyncio, uuid

    alert_id = payload.get("alert_id") or f"ALT-{uuid.uuid4().hex[:8].upper()}"
    event_id = payload.get("event_id") or f"EVT-{uuid.uuid4().hex[:8].upper()}"
    camera_id = payload.get("camera_id") or "cam_01"
    severity = payload.get("severity") or "high"
    rule = payload.get("rule") or "virtual_fence_breach"
    evidence_ref = payload.get("evidence_ref") or f"/api/v1/evidence/SNAPSHOT-{uuid.uuid4().hex[:6].upper()}.jpg"

    db_alert = Alert(
        alert_id=alert_id,
        event_id=event_id,
        severity=severity,
        rule=rule,
        status="new",
        created_at=datetime.utcnow(),
        evidence_ref=evidence_ref
    )
    db.add(db_alert)

    db_evidence = Evidence(
        evidence_id=f"EVD-{uuid.uuid4().hex[:8].upper()}",
        event_id=event_id,
        snapshot_ref=evidence_ref,
        retention_metadata={"camera_id": camera_id}
    )
    db.add(db_evidence)

    await db.commit()
    await db.refresh(db_alert)

    alert_event = AlertEvent(
        alert_id=db_alert.alert_id,
        event_id=db_alert.event_id,
        severity=db_alert.severity,
        rule=db_alert.rule,
        status=db_alert.status,
        created_at=db_alert.created_at.isoformat() + "Z",
        acknowledged_by=None,
        evidence_ref=db_alert.evidence_ref,
        camera_id=camera_id
    )

    await alert_broadcaster.broadcast_alert(alert_event)
    asyncio.create_task(trigger_c2_webhook(alert_event))

    return alert_event


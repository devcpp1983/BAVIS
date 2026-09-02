import logging
import httpx
from app.core.config import settings
from app.schemas.contract import AlertEvent

logger = logging.getLogger("bavis.webhook")


async def trigger_c2_webhook(alert: AlertEvent):
    """
    Integration stub: Sends alert notifications to external C2 / Security platforms.
    """
    logger.info(f"[C2 WEBHOOK STUB] Triggered alert notification to C2 endpoint: {settings.C2_WEBHOOK_URL}")
    logger.info(f"[C2 WEBHOOK STUB] Payload: Alert ID={alert.alert_id}, Rule={alert.rule}, Severity={alert.severity}")

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.post(settings.C2_WEBHOOK_URL, json=alert.model_dump())
    except Exception as e:
        logger.debug(f"[C2 WEBHOOK STUB] Endpoint not reachable (expected in demo): {e}")

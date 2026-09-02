import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.alert_service import alert_broadcaster

logger = logging.getLogger("bavis.websocket")
router = APIRouter()


@router.websocket("/stream")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    Real-time alert streaming channel over WebSocket.
    """
    await alert_broadcaster.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional ping messages
            data = await websocket.receive_text()
            logger.debug(f"Received ping/message from dashboard client: {data}")
    except WebSocketDisconnect:
        alert_broadcaster.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        alert_broadcaster.disconnect(websocket)

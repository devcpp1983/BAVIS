import json
import asyncio
import logging
from typing import List, Set
from fastapi import WebSocket
import redis.asyncio as aioredis

from app.core.config import settings
from app.schemas.contract import AlertEvent

logger = logging.getLogger("bavis.alert_service")


class AlertBroadcaster:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.redis_client = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast_alert(self, alert_data: AlertEvent):
        payload = alert_data.model_dump()
        payload_str = json.dumps(payload)

        # 1. Direct in-memory broadcast to connected WebSocket clients
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.warning(f"Error sending alert over WebSocket: {e}")
                disconnected.add(connection)

        for conn in disconnected:
            self.disconnect(conn)

        # 2. Publish to Redis channel if available
        try:
            if not self.redis_client:
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis_client.publish("bavis_alerts", payload_str)
        except Exception:
            pass  # Redis optional fallback


alert_broadcaster = AlertBroadcaster()

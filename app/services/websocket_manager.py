"""
app/services/websocket_manager.py
───────────────────────────────────
WebSocket connection manager for live ride price updates.

Architecture:
  - Each client connects to WS /api/v1/ws/rides/{comparison_id}
  - The server re-fetches ride prices every WS_PRICE_REFRESH_SECONDS
  - If any price changes by > 5% or surge status changes, a push is sent
  - Connections are tracked per user_id in a Redis set (for horizontal scaling)
  - A Celery task also scans active comparisons and fires FCM if surge starts

Message types sent to client:
  { "type": "price_update",  "data": RideComparisonResponse }
  { "type": "surge_alert",   "data": { warning, multiplier } }
  { "type": "ping",          "data": { "ts": epoch } }
  { "type": "error",         "data": { "message": str } }
"""
from __future__ import annotations

import asyncio
import json
import time
from collections import defaultdict
from typing import Dict, Optional, Set
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self):
        # comparison_id → set of active WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, comparison_id: str) -> bool:
        """Accept a new WebSocket connection. Returns False if limit exceeded."""
        async with self._lock:
            if len(self._connections[comparison_id]) >= settings.WS_MAX_CONNECTIONS_PER_USER:
                await websocket.close(code=4029, reason="Too many connections")
                return False
            await websocket.accept()
            self._connections[comparison_id].add(websocket)
            logger.info(
                "WS connected",
                comparison_id=comparison_id,
                total=len(self._connections[comparison_id]),
            )
            return True

    async def disconnect(self, websocket: WebSocket, comparison_id: str) -> None:
        async with self._lock:
            self._connections[comparison_id].discard(websocket)
            if not self._connections[comparison_id]:
                del self._connections[comparison_id]
        logger.info("WS disconnected", comparison_id=comparison_id)

    async def send_to_comparison(self, comparison_id: str, message: dict) -> int:
        """Broadcast a message to all clients watching a comparison. Returns send count."""
        dead: list[WebSocket] = []
        sent = 0
        for ws in list(self._connections.get(comparison_id, set())):
            try:
                await ws.send_text(json.dumps(message))
                sent += 1
            except Exception:
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections[comparison_id].discard(ws)

        return sent

    async def broadcast(self, message: dict) -> int:
        """Send a message to ALL active connections (e.g. system alerts)."""
        total = 0
        for comparison_id in list(self._connections.keys()):
            total += await self.send_to_comparison(comparison_id, message)
        return total

    def active_comparison_ids(self) -> list[str]:
        return list(self._connections.keys())

    def connection_count(self) -> int:
        return sum(len(v) for v in self._connections.values())


# Singleton instance
ws_manager = ConnectionManager()


async def handle_ride_websocket(
    websocket: WebSocket,
    comparison_id: str,
    db,
    current_user=None,
) -> None:
    """
    Main WebSocket handler for a ride comparison session.

    1. Accepts the connection
    2. Immediately sends the current ride options
    3. Enters a loop: every WS_PRICE_REFRESH_SECONDS, re-fetches and diffs prices
    4. Sends a price_update message if prices changed significantly
    5. Sends a surge_alert if surge status changed
    6. Handles ping/pong keepalive from the client
    """
    connected = await ws_manager.connect(websocket, comparison_id)
    if not connected:
        return

    try:
        # Send initial ping
        await websocket.send_text(json.dumps({
            "type": "connected",
            "data": {
                "comparison_id": comparison_id,
                "refresh_interval_s": settings.WS_PRICE_REFRESH_SECONDS,
                "ts": time.time(),
            }
        }))

        # Fetch initial data
        from app.services.ride_comparison_service import refresh_comparison_prices
        last_options = await refresh_comparison_prices(comparison_id, db)
        if last_options:
            await websocket.send_text(json.dumps({
                "type": "price_update",
                "data": last_options,
            }))

        # Main refresh loop
        while True:
            try:
                # Wait for either a client message or the refresh interval
                wait = asyncio.create_task(
                    asyncio.sleep(settings.WS_PRICE_REFRESH_SECONDS)
                )
                recv = asyncio.create_task(websocket.receive_text())
                done, pending = await asyncio.wait(
                    [wait, recv], return_when=asyncio.FIRST_COMPLETED
                )
                for t in pending:
                    t.cancel()

                # If client sent something, handle it
                if recv in done:
                    try:
                        msg = json.loads(recv.result())
                        if msg.get("type") == "ping":
                            await websocket.send_text(json.dumps({
                                "type": "pong",
                                "data": {"ts": time.time()},
                            }))
                    except (json.JSONDecodeError, Exception):
                        pass
                    continue

                # Refresh interval fired — fetch new prices
                new_options = await refresh_comparison_prices(comparison_id, db)
                if not new_options:
                    continue

                # Detect significant changes
                changed, surge_changed, surge_now = _detect_changes(last_options, new_options)

                if changed:
                    await websocket.send_text(json.dumps({
                        "type": "price_update",
                        "data": new_options,
                        "ts":   time.time(),
                    }))

                if surge_changed and surge_now:
                    await websocket.send_text(json.dumps({
                        "type": "surge_alert",
                        "data": {
                            "message": "Surge pricing just started — fares have increased.",
                            "ts": time.time(),
                        },
                    }))
                    # Also fire FCM if the user has a device token
                    if current_user and current_user.fcm_token:
                        from app.services.notifications import send_surge_alert
                        surging = [
                            o["platform"] for o in new_options.get("ride_options", [])
                            if o.get("is_surge")
                        ]
                        mult = max(
                            (o.get("surge_multiplier", 1.0) for o in new_options.get("ride_options", []) if o.get("is_surge")),
                            default=1.0,
                        )
                        asyncio.create_task(send_surge_alert(
                            device_token=current_user.fcm_token,
                            platform_names=surging,
                            multiplier=mult,
                            origin=new_options.get("origin_address", ""),
                            destination=new_options.get("destination_address", ""),
                        ))

                last_options = new_options

            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error("WebSocket error", comparison_id=comparison_id, error=str(exc))
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": {"message": "An internal error occurred."},
            }))
        except Exception:
            pass
    finally:
        await ws_manager.disconnect(websocket, comparison_id)


def _detect_changes(
    old: Optional[dict],
    new: Optional[dict],
) -> tuple[bool, bool, bool]:
    """
    Compare two comparison snapshots.
    Returns (price_changed, surge_status_changed, surge_is_now_active).
    """
    if not old or not new:
        return True, False, False

    old_options = {
        f"{o['platform']}:{o['ride_category']}": o
        for o in old.get("ride_options", [])
    }
    new_options = {
        f"{o['platform']}:{o['ride_category']}": o
        for o in new.get("ride_options", [])
    }

    price_changed = False
    for key, new_opt in new_options.items():
        old_opt = old_options.get(key)
        if not old_opt:
            price_changed = True
            break
        old_fare = old_opt.get("fare_estimate_ghs", 0)
        new_fare = new_opt.get("fare_estimate_ghs", 0)
        if old_fare > 0 and abs(new_fare - old_fare) / old_fare > 0.05:
            price_changed = True
            break

    old_surge = old.get("is_surge_detected", False)
    new_surge = new.get("is_surge_detected", False)
    surge_changed = old_surge != new_surge

    return price_changed, surge_changed, new_surge
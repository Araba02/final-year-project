"""
app/api/v1/endpoints/ws.py
───────────────────────────
WebSocket endpoints for live ride price streaming.

  WS /api/v1/ws/rides/{comparison_id}

The client connects immediately after receiving a RideComparisonResponse.
The server sends updated prices every WS_PRICE_REFRESH_SECONDS seconds and
pushes surge alerts in real time when pricing changes significantly.

Authentication:
  Pass the JWT access token as a query parameter:
  ws://host/api/v1/ws/rides/{id}?token=<access_token>
  (WebSocket handshake cannot send Authorization headers in browsers/Flutter)
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.logging import get_logger
from app.services.websocket_manager import handle_ride_websocket, ws_manager

router = APIRouter(prefix="/ws", tags=["WebSocket"])
logger = get_logger(__name__)


@router.websocket("/rides/{comparison_id}")
async def websocket_ride_prices(
    websocket: WebSocket,
    comparison_id: str,
    token: Optional[str] = Query(None, description="JWT access token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Live ride price stream for a given comparison ID.

    **Protocol:**

    Server → Client messages:
    ```json
    { "type": "connected",     "data": { "comparison_id": "...", "refresh_interval_s": 30 } }
    { "type": "price_update",  "data": { ...RideComparisonResponse } }
    { "type": "surge_alert",   "data": { "message": "...", "ts": 1234567890 } }
    { "type": "pong",          "data": { "ts": 1234567890 } }
    { "type": "error",         "data": { "message": "..." } }
    ```

    Client → Server messages:
    ```json
    { "type": "ping" }
    ```
    """
    # Optionally authenticate the user from the token query param
    current_user = None
    if token:
        try:
            from app.api.deps import get_current_user
            from fastapi.security import OAuth2PasswordBearer
            current_user = await get_current_user(token=token, db=db)
        except Exception:
            pass  # anonymous connections are allowed

    await handle_ride_websocket(
        websocket=websocket,
        comparison_id=comparison_id,
        db=db,
        current_user=current_user,
    )


@router.get(
    "/stats",
    tags=["WebSocket"],
    summary="WebSocket connection statistics (admin)",
)
async def ws_stats():
    """Returns current active WebSocket connection counts."""
    return {
        "active_comparisons": len(ws_manager.active_comparison_ids()),
        "total_connections":  ws_manager.connection_count(),
        "comparison_ids":     ws_manager.active_comparison_ids(),
    }
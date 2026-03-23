"""
app/utils/api_key_middleware.py
────────────────────────────────
X-API-Key middleware for mobile app authentication.

Every request from the Flutter app must include:
    X-API-Key: <MOBILE_API_KEY>

This is separate from the user JWT — it identifies the app itself,
not the user. Useful for:
  - Blocking unauthorized API consumers (scrapers, competitors)
  - Rate limiting by app version
  - Future: per-version feature flags

Excluded paths:
  - /health         (infrastructure monitoring)
  - /api/v1/docs    (Swagger UI)
  - /api/v1/redoc   (ReDoc)
  - /api/v1/openapi.json

In development mode (APP_ENV=development) the key check is skipped
so the Swagger UI and curl testing work without headers.
"""
from __future__ import annotations

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_EXCLUDED_PREFIXES = (
    "/health",
    "/api/v1/docs",
    "/api/v1/redoc",
    "/api/v1/openapi.json",
)


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip in development or for excluded paths
        if settings.APP_ENV == "development":
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in _EXCLUDED_PREFIXES):
            return await call_next(request)

        # WebSocket connections pass token as query param, skip X-API-Key
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")
        if not api_key or api_key != settings.MOBILE_API_KEY:
            logger.warning(
                "Invalid or missing API key",
                path=path,
                ip=request.client.host if request.client else "unknown",
            )
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "Invalid or missing X-API-Key header.",
                    "code":   "INVALID_API_KEY",
                },
            )

        return await call_next(request)
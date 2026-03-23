"""
app/utils/exception_handlers.py
─────────────────────────────────
Global FastAPI exception handlers.
Returns consistent JSON error shapes across the entire API.

Response shape:
    {
        "detail": "Human-readable message",
        "code":   "MACHINE_READABLE_CODE",   (optional)
        "errors": [...]                        (validation errors only)
    }
"""
from __future__ import annotations

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.logging import get_logger

logger = get_logger(__name__)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Request validation failed.", "errors": errors},
    )


async def integrity_error_handler(
    request: Request, exc: IntegrityError
) -> JSONResponse:
    logger.error("Database integrity error", error=str(exc.orig))
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": "A data conflict occurred. The resource may already exist.",
            "code": "INTEGRITY_ERROR",
        },
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected internal server error occurred.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )

"""
app/main.py
────────────
FastAPI application factory.

Starting the server with:
    uvicorn app.main:app --reload

automatically starts:
  - The FastAPI REST + WebSocket server
  - A Celery worker thread (background task execution)
  - A Celery Beat thread (periodic task scheduler)

No separate terminal or command needed.
"""
from contextlib import asynccontextmanager
import threading

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy.exc import IntegrityError

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.redis_client import close_redis, init_redis
from app.utils.api_key_middleware import APIKeyMiddleware
from app.utils.exception_handlers import (
    generic_exception_handler,
    integrity_error_handler,
    validation_exception_handler,
)

configure_logging()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)

# Module-level references so we can stop them on shutdown
_celery_worker_thread: threading.Thread | None = None
_celery_beat_thread:   threading.Thread | None = None


def _start_celery_worker():
    """
    Start the Celery worker in a daemon background thread.
    Daemon=True means it dies automatically when the main process exits.
    """
    from app.worker.celery_app import celery_app

    logger.info("Starting Celery worker thread...")
    argv = [
        "worker",
        "--loglevel=info",
        "--concurrency=2",        # 2 worker processes
        "--queues=celery",
        "--without-gossip",       # reduce noise in logs
        "--without-mingle",
        "--without-heartbeat",
    ]
    celery_app.worker_main(argv=argv)


def _start_celery_beat():
    """
    Start the Celery Beat scheduler in a daemon background thread.
    Beat reads beat_schedule from celery_app.conf and queues tasks on time.
    """
    import time
    # Small delay so the worker is ready before beat starts sending tasks
    time.sleep(3)

    from celery.apps.beat import Beat
    from app.worker.celery_app import celery_app

    logger.info("Starting Celery Beat scheduler thread...")
    beat = Beat(app=celery_app, loglevel="info", schedule="/tmp/celerybeat-schedule")
    beat.run()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup / shutdown lifecycle.
    Starts Celery worker + Beat automatically on server start.
    """
    global _celery_worker_thread, _celery_beat_thread

    logger.info(
        "Starting RideSync+ API",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    # ── Redis ─────────────────────────────────────────────────────────────────
    await init_redis()

    # ── Firebase (non-blocking) ───────────────────────────────────────────────
    from app.services.notifications import _init_firebase
    _init_firebase()

    # ── Celery Worker ─────────────────────────────────────────────────────────
    _celery_worker_thread = threading.Thread(
        target=_start_celery_worker,
        name="celery-worker",
        daemon=True,   # dies when FastAPI process exits
    )
    _celery_worker_thread.start()
    logger.info("Celery worker thread started")

    # ── Celery Beat ───────────────────────────────────────────────────────────
    _celery_beat_thread = threading.Thread(
        target=_start_celery_beat,
        name="celery-beat",
        daemon=True,
    )
    _celery_beat_thread.start()
    logger.info("Celery Beat scheduler thread started")

    logger.info(
        "RideSync+ fully started — API + Worker + Beat all running",
        version=settings.APP_VERSION,
    )

    yield  # ── server is running ──────────────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("Shutting down RideSync+ API")
    await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "**RideSync+** — Intelligent multi-platform ride-hailing comparison "
            "and optimization system for Ghana.\n\n"
            "### Features\n"
            "- Real road distance & drive time via **Google Distance Matrix API**\n"
            "- Place autocomplete via **Google Places API**\n"
            "- Address resolution via **Google Geocoding API**\n"
            "- Ride options from **Uber, Bolt, Yango, Shaxi**\n"
            "- Multi-criteria recommendation engine (cost / time / rating)\n"
            "- Real-time price streaming via **WebSocket**\n"
            "- Surge detection + **Firebase push notifications**\n"
            "- ML surge prediction (RandomForest, auto-retrained every 6h)\n"
            "- Rate limiting per IP and per authenticated user\n\n"
            "### Authentication\n"
            "Use `/auth/login` to obtain a Bearer token, "
            "then click **Authorize** above."
        ),
        version=settings.APP_VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        contact={
            "name":  "Christabel Araba Edumadze",
            "email": "student@university.edu.gh",
        },
        license_info={
            "name": "Academic Use — BSc IT Final Year Project 2025/2026"
        },
        lifespan=lifespan,
    )

    # ── Rate limiter ──────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ── CORS ──────────────────────────────────────────────────────────────────
    # In development we allow any origin so the Expo web client works on
    # whatever port Metro picks (8081, 19006, …) without re-configuring.
    # Auth is Bearer-token based (no cookies), so credentialed CORS isn't
    # needed — which lets us use the "*" wildcard. Production uses the
    # explicit allow-list from BACKEND_CORS_ORIGINS with credentials enabled.
    if settings.APP_ENV == "development":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(o) for o in settings.BACKEND_CORS_ORIGINS] or ["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # ── Mobile API key auth ───────────────────────────────────────────────────
    app.add_middleware(APIKeyMiddleware)

    # ── Exception handlers ────────────────────────────────────────────────────
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], summary="Health check")
    async def health():
        from app.db.redis_client import get_redis
        redis_ok = False
        try:
            redis_ok = await get_redis().ping()
        except Exception:
            pass

        worker_alive = (
            _celery_worker_thread is not None and _celery_worker_thread.is_alive()
        )
        beat_alive = (
            _celery_beat_thread is not None and _celery_beat_thread.is_alive()
        )

        return {
            "status":       "ok",
            "app":          settings.APP_NAME,
            "version":      settings.APP_VERSION,
            "environment":  settings.APP_ENV,
            "redis":        "ok" if redis_ok else "unavailable",
            "celery_worker": "running" if worker_alive else "stopped",
            "celery_beat":   "running" if beat_alive else "stopped",
            "google_maps":  "configured" if settings.GOOGLE_MAPS_API_KEY else "not configured",
            "firebase":     "configured" if (
                settings.FIREBASE_CREDENTIALS_PATH or settings.FIREBASE_CREDENTIALS_JSON
            ) else "not configured",
        }

    return app


app = create_app()
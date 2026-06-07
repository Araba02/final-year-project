"""
app/worker/celery_app.py
─────────────────────────
Celery application instance + periodic beat schedule.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "ridesync",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Accra",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    # Suppress the Celery 6.0 deprecation warning
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    # Retrain the surge ML model every 6 hours
    "retrain-surge-model-every-6h": {
        "task":     "app.worker.tasks.retrain_surge_model_task",
        "schedule": crontab(minute=0, hour="*/6"),
    },
    # Scan for active surges and send FCM alerts every 5 minutes
    "scan-active-surges-every-5min": {
        "task":     "app.worker.tasks.scan_active_surges_task",
        "schedule": crontab(minute="*/5"),
    },
}
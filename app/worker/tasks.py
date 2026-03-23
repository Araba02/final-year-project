"""
app/worker/tasks.py
────────────────────
Celery background tasks — fully synchronous.

Celery workers fork from the main process. asyncpg (the async PostgreSQL
driver) does not survive a fork, so ALL database work here uses the
synchronous psycopg2 engine via app.db.sync_session.

Tasks:
  retrain_surge_model_task   — retrains RandomForest on latest SurgeEvent data
  scan_active_surges_task    — scans recent surges, sends FCM push notifications
"""
import logging

from app.core.logging import get_logger
from app.worker.celery_app import celery_app

logger = get_logger(__name__)

# Silence SQLAlchemy engine logs inside Celery workers — they flood the console
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)


def _ensure_models_registered():
    """
    Force SQLAlchemy to register all ORM models in this process.
    Celery forks before models are imported, so relationships like
    RideComparison.user → User are unresolvable unless we import them here.
    """
    import app.models.user    # noqa: F401
    import app.models.ride    # noqa: F401
    import app.models.surge   # noqa: F401


# ── Surge model retraining ────────────────────────────────────────────────────

@celery_app.task(
    name="app.worker.tasks.retrain_surge_model_task",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def retrain_surge_model_task(self):
    """
    Retrain the surge prediction RandomForest model.
    Reads SurgeEvent records via synchronous psycopg2 session,
    trains the model, and saves it to /tmp/ridesync_surge_model.pkl.
    """
    _ensure_models_registered()

    task_id = self.request.id
    logger.info("═══ Surge model retrain STARTED ═══", task_id=task_id)

    try:
        from pathlib import Path
        import pickle
        from sqlalchemy import select, func

        from app.core.config import settings
        from app.db.sync_session import get_sync_db
        from app.models.surge import SurgeEvent

        MIN_SAMPLES = 50

        # ── Step 1: Load training data ────────────────────────────────────────
        logger.info("  [1/4] Loading surge events from database...", task_id=task_id)
        with get_sync_db() as db:
            events = db.execute(select(SurgeEvent)).scalars().all()
            total_events = len(events)

        logger.info(f"  [1/4] Found {total_events} surge events", task_id=task_id)

        if total_events < MIN_SAMPLES:
            logger.warning(
                f"  ✗ Not enough data to train — need {MIN_SAMPLES}, have {total_events}. "
                f"Run 'python scripts/seed_db.py' to generate demo data.",
                task_id=task_id,
            )
            return {"success": False, "reason": "insufficient_data", "count": total_events}

        # ── Step 2: Build feature matrix ──────────────────────────────────────
        logger.info("  [2/4] Building feature matrix...", task_id=task_id)
        import pandas as pd
        import numpy as np

        df = pd.DataFrame([{
            "hour_of_day": e.hour_of_day,
            "day_of_week": e.day_of_week,
            "is_weekend":  int(e.is_weekend),
            "is_surge":    int(e.surge_multiplier >= settings.SURGE_THRESHOLD_MULTIPLIER),
        } for e in events])

        surge_rate = round(df["is_surge"].mean() * 100, 1)
        logger.info(
            f"  [2/4] Features ready — {len(df)} rows, surge rate: {surge_rate}%",
            task_id=task_id,
        )

        X = df[["hour_of_day", "day_of_week", "is_weekend"]].values
        y = df["is_surge"].values

        # ── Step 3: Train the model ───────────────────────────────────────────
        logger.info("  [3/4] Training RandomForest (100 trees)...", task_id=task_id)

        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, classification_report

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(X_train, y_train)

        y_pred    = clf.predict(X_test)
        accuracy  = accuracy_score(y_test, y_pred)
        importances = dict(zip(
            ["hour_of_day", "day_of_week", "is_weekend"],
            [round(float(v), 4) for v in clf.feature_importances_],
        ))

        logger.info(
            f"  [3/4] Training complete — accuracy: {round(accuracy * 100, 2)}%",
            task_id=task_id,
        )
        logger.info(
            f"  [3/4] Feature importances: {importances}",
            task_id=task_id,
        )

        # ── Step 4: Save to disk + update in-memory cache ─────────────────────
        logger.info("  [4/4] Saving model to disk...", task_id=task_id)

        model_path = Path("/tmp/ridesync_surge_model.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(clf, f)

        import app.services.analytics_service as svc
        svc._cached_model = clf

        logger.info(
            f"═══ Surge model retrain COMPLETE ═══  "
            f"samples={total_events}  accuracy={round(accuracy * 100, 2)}%  "
            f"path={model_path}",
            task_id=task_id,
        )
        return {
            "success":      True,
            "samples":      total_events,
            "accuracy":     round(accuracy, 4),
            "surge_rate":   surge_rate,
            "importances":  importances,
        }

    except Exception as exc:
        logger.error(f"═══ Surge model retrain FAILED: {exc} ═══", task_id=task_id)
        raise self.retry(exc=exc)


# ── Active surge scanner ──────────────────────────────────────────────────────

@celery_app.task(
    name="app.worker.tasks.scan_active_surges_task",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
)
def scan_active_surges_task(self):
    """
    Scan the last 30 minutes of comparisons for active surge conditions.
    Sends FCM push notifications to users who have a registered FCM token.
    """
    _ensure_models_registered()

    task_id = self.request.id
    logger.info("─── Surge scan STARTED ───", task_id=task_id)

    try:
        from datetime import datetime, timedelta, timezone
        from sqlalchemy import select, and_

        from app.db.sync_session import get_sync_db
        from app.models.ride import RideComparison
        from app.models.user import User

        cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)

        with get_sync_db() as db:
            rows = db.execute(
                select(RideComparison, User)
                .join(User, RideComparison.user_id == User.id)
                .where(
                    and_(
                        RideComparison.is_surge_detected == True,   # noqa: E712
                        RideComparison.created_at >= cutoff,
                        User.fcm_token.isnot(None),
                        User.is_active == True,                      # noqa: E712
                    )
                )
                .limit(50)
            ).fetchall()

        logger.info(
            f"─── Surge scan: found {len(rows)} active surge comparison(s) in last 30 min",
            task_id=task_id,
        )

        sent = 0
        if rows:
            try:
                from firebase_admin import messaging
                for comparison, user in rows:
                    try:
                        message = messaging.Message(
                            notification=messaging.Notification(
                                title="⚠ Surge pricing alert",
                                body=(
                                    f"Fares are elevated for "
                                    f"{comparison.origin_address} → "
                                    f"{comparison.destination_address}. "
                                    f"Consider waiting 10-15 minutes."
                                ),
                            ),
                            data={
                                "type":          "surge_alert",
                                "comparison_id": str(comparison.id),
                            },
                            token=user.fcm_token,
                        )
                        messaging.send(message)
                        sent += 1
                        logger.info(
                            f"  FCM sent to user {str(user.id)[:8]}...",
                            task_id=task_id,
                        )
                    except Exception as send_exc:
                        logger.warning(
                            f"  FCM failed for user {str(user.id)[:8]}...: {send_exc}",
                            task_id=task_id,
                        )
            except ImportError:
                logger.warning(
                    "─── Firebase not available — skipping FCM notifications",
                    task_id=task_id,
                )
        else:
            logger.info("─── Surge scan: no active surges, no notifications sent", task_id=task_id)

        logger.info(
            f"─── Surge scan COMPLETE — checked={len(rows)}, sent={sent}",
            task_id=task_id,
        )
        return {"sent": sent, "checked": len(rows)}

    except Exception as exc:
        logger.error(f"─── Surge scan FAILED: {exc} ───", task_id=task_id)
        raise self.retry(exc=exc)
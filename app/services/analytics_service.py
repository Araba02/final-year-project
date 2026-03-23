"""
app/services/analytics_service.py
───────────────────────────────────
Predictive analytics + fare trend service.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import numpy as np
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.ride import RideComparison, RideOption
from app.models.surge import SurgeEvent
from app.schemas.ride import (
    FareTrendPoint,
    FareTrendsResponse,
    HistorySummaryResponse,
    SurgePredictionResponse,
)

logger = get_logger(__name__)

MODEL_PATH = Path("/tmp/ridesync_surge_model.pkl")
MIN_TRAINING_SAMPLES = 50

_ACCRA_RUSH_HOURS = {
    (7, 0), (7, 1), (7, 2), (7, 3), (7, 4),
    (8, 0), (8, 1), (8, 2), (8, 3), (8, 4),
    (17, 0), (17, 1), (17, 2), (17, 3), (17, 4),
    (18, 0), (18, 1), (18, 2), (18, 3), (18, 4),
    (19, 0), (19, 1), (19, 2), (19, 3), (19, 4),
    (23, 5), (23, 6), (0, 5), (0, 6),
}

_cached_model = None


def _load_model():
    global _cached_model
    if _cached_model is None and MODEL_PATH.exists():
        import pickle
        with open(MODEL_PATH, "rb") as f:
            _cached_model = pickle.load(f)
        logger.info("Surge prediction model loaded from disk")
    return _cached_model


def _rule_based_probability(hour: int, day_of_week: int) -> float:
    if (hour, day_of_week) in _ACCRA_RUSH_HOURS:
        return 0.80
    if day_of_week >= 5 and hour in {20, 21, 22, 23, 0, 1}:
        return 0.65
    if hour in {7, 8, 9, 17, 18, 19}:
        return 0.55
    return 0.15


async def train_surge_model(db: AsyncSession) -> bool:
    try:
        import pickle
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import classification_report
    except ImportError:
        logger.error("scikit-learn / pandas not installed")
        return False

    result = await db.execute(select(SurgeEvent))
    events = result.scalars().all()

    if len(events) < MIN_TRAINING_SAMPLES:
        logger.warning("Insufficient data for ML model", count=len(events))
        return False

    df = pd.DataFrame([{
        "hour_of_day": e.hour_of_day,
        "day_of_week": e.day_of_week,
        "is_weekend":  int(e.is_weekend),
        "is_surge":    int(e.surge_multiplier >= settings.SURGE_THRESHOLD_MULTIPLIER),
    } for e in events])

    X = df[["hour_of_day", "day_of_week", "is_weekend"]].values
    y = df["is_surge"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(
        n_estimators=100, max_depth=6, class_weight="balanced", random_state=42
    )
    clf.fit(X_train, y_train)

    report = classification_report(y_test, clf.predict(X_test), output_dict=True)
    logger.info("Surge model trained", samples=len(events), accuracy=round(report.get("accuracy", 0), 3))

    global _cached_model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    _cached_model = clf
    return True


async def get_surge_predictions(
    db: AsyncSession,
    platform: Optional[str] = None,
) -> List[SurgePredictionResponse]:
    from app.schemas.ride import Platform as PlatformEnum

    platforms = [platform] if platform else [p.value for p in PlatformEnum]
    model = _load_model()
    now = datetime.now(timezone.utc)
    predictions = []

    for plat in platforms:
        for hour_offset in range(24):
            target_hour = (now.hour + hour_offset) % 24
            day_of_week = (now.weekday() + (now.hour + hour_offset) // 24) % 7
            is_weekend   = int(day_of_week >= 5)

            if model is not None:
                features = np.array([[target_hour, day_of_week, is_weekend]])
                prob = float(model.predict_proba(features)[0][1])
            else:
                prob = _rule_based_probability(target_hour, day_of_week)

            risk = "low" if prob < 0.35 else "medium" if prob < 0.65 else "high"
            predictions.append(SurgePredictionResponse(
                platform=plat,
                predicted_hour=target_hour,
                predicted_day_of_week=day_of_week,
                surge_probability=round(prob, 3),
                risk_level=risk,
            ))

    return predictions


async def get_fare_trends(
    db: AsyncSession,
    days: int = 30,
    platforms: Optional[List[str]] = None,
) -> FareTrendsResponse:
    """
    Returns daily average fare per platform for the last N days.
    Powers the fare history charts in the mobile app and admin dashboard.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    from app.schemas.ride import Platform as PlatformEnum
    selected = platforms or [p.value for p in PlatformEnum]

    # Daily average fare per platform using raw SQL for efficiency
    stmt = text("""
        SELECT
            DATE(rc.created_at AT TIME ZONE 'UTC') AS day,
            ro.platform,
            ROUND(AVG(ro.fare_estimate_ghs)::numeric, 2) AS avg_fare,
            COUNT(DISTINCT rc.id) AS comparison_count
        FROM ride_options ro
        JOIN ride_comparisons rc ON ro.comparison_id = rc.id
        WHERE rc.created_at >= :cutoff
          AND ro.platform = ANY(:platforms)
        GROUP BY day, ro.platform
        ORDER BY day ASC, ro.platform ASC
    """)

    result = await db.execute(stmt, {"cutoff": cutoff, "platforms": selected})
    rows = result.fetchall()

    points = [
        FareTrendPoint(
            date=str(row.day),
            platform=row.platform,
            avg_fare_ghs=float(row.avg_fare),
            comparison_count=int(row.comparison_count),
        )
        for row in rows
    ]

    return FareTrendsResponse(
        points=points,
        date_range_days=days,
        platforms=selected,
    )


async def get_user_history_summary(
    user_id,
    db: AsyncSession,
    days: int = 30,
) -> HistorySummaryResponse:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    count_result = await db.execute(
        select(func.count(RideComparison.id)).where(
            RideComparison.user_id == user_id,
            RideComparison.created_at >= cutoff,
        )
    )
    total = count_result.scalar_one() or 0

    if total == 0:
        return HistorySummaryResponse(
            total_comparisons=0, average_fare_ghs=0.0,
            surge_frequency_pct=0.0, most_used_platform="N/A",
            date_range_days=days,
        )

    avg_fare_result = await db.execute(
        select(func.avg(RideOption.fare_estimate_ghs))
        .join(RideComparison, RideOption.comparison_id == RideComparison.id)
        .where(RideComparison.user_id == user_id, RideComparison.created_at >= cutoff)
    )
    avg_fare = float(avg_fare_result.scalar_one() or 0.0)

    surge_count_result = await db.execute(
        select(func.count(RideComparison.id)).where(
            RideComparison.user_id == user_id,
            RideComparison.created_at >= cutoff,
            RideComparison.is_surge_detected == True,  # noqa: E712
        )
    )
    surge_count = surge_count_result.scalar_one() or 0
    surge_pct = round((surge_count / total) * 100, 1)

    platform_result = await db.execute(
        select(RideOption.platform, func.count(RideOption.id).label("cnt"))
        .join(RideComparison, RideOption.comparison_id == RideComparison.id)
        .where(RideComparison.user_id == user_id, RideComparison.created_at >= cutoff)
        .group_by(RideOption.platform)
        .order_by(func.count(RideOption.id).desc())
        .limit(1)
    )
    top = platform_result.first()

    return HistorySummaryResponse(
        total_comparisons=total,
        average_fare_ghs=round(avg_fare, 2),
        surge_frequency_pct=surge_pct,
        most_used_platform=top[0].capitalize() if top else "N/A",
        date_range_days=days,
    )
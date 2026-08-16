"""
app/services/surge_detector.py
────────────────────────────────
Surge Detection Service.

Detects surge pricing conditions from aggregated ride options and
generates human-readable user warnings. Also persists surge events
to the database for use by the predictive analytics model.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.surge import SurgeEvent
from app.schemas.ride import RideOptionResponse

logger = get_logger(__name__)


def _risk_label(multiplier: float) -> str:
    if multiplier >= 1.8:
        return "very high"
    if multiplier >= 1.5:
        return "high"
    if multiplier >= settings.SURGE_THRESHOLD_MULTIPLIER:
        return "moderate"
    return "normal"


def detect_surge(
    options: List[RideOptionResponse],
) -> Tuple[bool, Optional[str]]:
    """
    Analyse ride options and determine if surge pricing is active.

    Returns:
        (is_surge_detected, warning_message)
    """
    surging = [o for o in options if o.is_surge]
    if not surging:
        return False, None

    avg_multiplier = sum(o.surge_multiplier for o in surging) / len(surging)
    platforms = list({o.platform.capitalize() for o in surging})
    risk = _risk_label(avg_multiplier)

    warning = (
        f"⚠️ Surge pricing detected ({risk} — {avg_multiplier:.1f}x) "
        f"on {', '.join(platforms)}. "
        f"Consider waiting 10–15 minutes for fares to normalise."
    )

    logger.info(
        "Surge detected",
        multiplier=round(avg_multiplier, 2),
        platforms=platforms,
        risk=risk,
    )

    return True, warning


async def persist_surge_events(
    options: List[RideOptionResponse],
    db: AsyncSession,
) -> None:
    """
    Persist surge events to the database for historical analytics.
    Called as a fire-and-forget side effect after each comparison.
    """
    now = datetime.now(timezone.utc)
    events = [
        SurgeEvent(
            platform=o.platform,
            hour_of_day=now.hour,
            day_of_week=now.weekday(),
            surge_multiplier=o.surge_multiplier,
            is_weekend=now.weekday() >= 5,
        )
        for o in options
        if o.is_surge
    ]

    if events:
        db.add_all(events)
        await db.flush()
        logger.debug("Surge events persisted", count=len(events))

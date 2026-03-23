"""
app/api/v1/endpoints/analytics.py
───────────────────────────────────
Analytics endpoints: surge predictions, user history summary, fare trends.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ride import FareTrendsResponse, HistorySummaryResponse, SurgePredictionResponse
from app.services.analytics_service import (
    get_fare_trends,
    get_surge_predictions,
    get_user_history_summary,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/surge-predictions",
    response_model=List[SurgePredictionResponse],
    summary="Surge pricing forecast for the next 24 hours",
    description=(
        "Uses a RandomForest ML model trained on historical surge events. "
        "Falls back to a rule-based Accra rush-hour model when insufficient "
        "training data is available (< 50 surge events)."
    ),
)
async def surge_predictions(
    platform: Optional[str] = Query(
        None, description="Filter by platform: uber | bolt | yango | shaxi"
    ),
    db: AsyncSession = Depends(get_db),
):
    return await get_surge_predictions(db=db, platform=platform)


@router.get(
    "/fare-trends",
    response_model=FareTrendsResponse,
    summary="Historical fare trends by platform (for charts)",
    description=(
        "Returns daily average fares per platform over a configurable lookback window. "
        "Powers fare history charts in the mobile app and admin dashboard."
    ),
)
async def fare_trends(
    days: int = Query(default=30, ge=1, le=365),
    platforms: Optional[str] = Query(
        None,
        description="Comma-separated platform list, e.g. 'uber,bolt'. Default: all.",
    ),
    db: AsyncSession = Depends(get_db),
):
    platform_list = [p.strip() for p in platforms.split(",")] if platforms else None
    return await get_fare_trends(db=db, days=days, platforms=platform_list)


@router.get(
    "/summary",
    response_model=HistorySummaryResponse,
    summary="Personalised analytics summary for the authenticated user",
)
async def history_summary(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_history_summary(
        user_id=current_user.id, db=db, days=days
    )
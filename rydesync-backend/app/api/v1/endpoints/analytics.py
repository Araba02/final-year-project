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
from app.schemas.ride import (
    FareTrendsResponse,
    HistorySummaryResponse,
    PopularRouteResponse,
    SurgePredictionResponse,
)
from app.services.analytics_service import (
    get_fare_trends,
    get_popular_routes,
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


@router.get(
    "/popular-routes",
    response_model=List[PopularRouteResponse],
    summary="Most compared routes across the platform",
    description=(
        "Returns the top routes by comparison count across all users. "
        "Used to populate the Popular Routes section in the Insights screen."
    ),
)
async def popular_routes_endpoint(
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    rows = await get_popular_routes(db=db, limit=limit)
    return [
        PopularRouteResponse(
            origin_address=row.origin_address,
            destination_address=row.destination_address,
            count=row.cnt,
            avg_duration_min=int(row.avg_dur) if row.avg_dur is not None else None,
            avg_distance_km=round(float(row.avg_dist), 1) if row.avg_dist is not None else None,
        )
        for row in rows
    ]
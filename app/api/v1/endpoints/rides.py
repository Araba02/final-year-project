"""
app/api/v1/endpoints/rides.py
──────────────────────────────
Ride comparison and history endpoints with rate limiting.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_optional_user
from app.core.config import settings
from app.db.session import get_db
from app.models.ride import RideComparison
from app.models.user import User
from app.schemas.ride import RideCompareRequest, RideComparisonResponse, RideOptionResponse
from app.services.ride_comparison_service import compare_rides

router  = APIRouter(prefix="/rides", tags=["Ride Comparison"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/compare",
    response_model=RideComparisonResponse,
    summary="Compare ride options across all platforms",
    description=(
        "Fetches real-route-distance-based fare estimates from Uber, Bolt, Yango, and Shaxi "
        "for a given origin/destination pair. Uses Google Distance Matrix for accurate "
        "road distance and drive time. Detects surge pricing and returns a ranked list "
        "with a top recommendation. Supports both anonymous and authenticated requests.\n\n"
        "**Rate limit:** 10 req/min (anonymous) / 30 req/min (authenticated)."
    ),
)
@limiter.limit(settings.RATE_LIMIT_COMPARE_ANONYMOUS)
async def compare(
    request: Request,
    payload: RideCompareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    user_id    = current_user.id        if current_user else None
    fcm_token  = current_user.fcm_token if current_user else None

    # Apply user's saved sort preference if not explicitly overridden
    if current_user and payload.sort_by.value == "cost":
        from app.schemas.ride import SortCriteria
        try:
            payload = payload.model_copy(
                update={"sort_by": SortCriteria(current_user.preferred_sort)}
            )
        except ValueError:
            pass

    try:
        result = await compare_rides(
            payload, db=db, user_id=user_id, user_fcm_token=fcm_token
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    return result


@router.get(
    "/history",
    response_model=List[RideComparisonResponse],
    summary="Get paginated ride comparison history",
)
async def get_history(
    limit:  int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RideComparison)
        .where(RideComparison.user_id == current_user.id)
        .options(selectinload(RideComparison.ride_options))
        .order_by(RideComparison.created_at.desc())
        .limit(limit).offset(offset)
    )
    comparisons = result.scalars().all()
    return [_comparison_to_response(c) for c in comparisons]


@router.get(
    "/history/{comparison_id}",
    response_model=RideComparisonResponse,
    summary="Get a specific comparison by ID",
)
async def get_comparison(
    comparison_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RideComparison)
        .where(
            RideComparison.id == comparison_id,
            RideComparison.user_id == current_user.id,
        )
        .options(selectinload(RideComparison.ride_options))
    )
    comparison = result.scalar_one_or_none()
    if not comparison:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found.")
    return _comparison_to_response(comparison)


def _comparison_to_response(c: RideComparison) -> RideComparisonResponse:
    return RideComparisonResponse(
        id=c.id,
        origin_address=c.origin_address,
        destination_address=c.destination_address,
        is_surge_detected=c.is_surge_detected,
        created_at=c.created_at,
        route_distance_km=c.route_distance_km,
        route_duration_min=c.route_duration_min,
        ride_options=[
            RideOptionResponse(
                id=o.id, platform=o.platform, ride_category=o.ride_category,
                fare_estimate_ghs=o.fare_estimate_ghs, fare_min_ghs=o.fare_min_ghs,
                fare_max_ghs=o.fare_max_ghs, eta_minutes=o.eta_minutes,
                driver_rating=o.driver_rating, drivers_nearby=o.drivers_nearby,
                is_surge=o.is_surge, surge_multiplier=o.surge_multiplier,
                deep_link_url=o.deep_link_url,
                road_distance_km=o.road_distance_km,
                road_duration_min=o.road_duration_min,
            )
            for o in c.ride_options
        ],
        recommendation=None,
        surge_warning=None,
    )
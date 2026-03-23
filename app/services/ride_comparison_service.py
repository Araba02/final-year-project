"""
app/services/ride_comparison_service.py
────────────────────────────────────────
Ride Comparison Service — central orchestrator.

Flow:
  1. Cache check (Redis, TTL=30s)
  2. Fan-out async fetch to all requested platform adapters
  3. Detect surge → fire FCM if user has device token
  4. Rank via recommendation engine
  5. Persist to PostgreSQL
  6. Cache and return
"""
from __future__ import annotations

import asyncio
import json
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logging import get_logger
from app.db.redis_client import get_redis
from app.models.ride import RideComparison, RideOption
from app.schemas.ride import (
    Platform,
    RideCompareRequest,
    RideComparisonResponse,
    RideOptionResponse,
    SortCriteria,
)
from app.services.platform_adapters import PLATFORM_ADAPTERS, RideOptionDTO
from app.services.recommendation_engine import rank_rides
from app.services.surge_detector import detect_surge, persist_surge_events

logger = get_logger(__name__)


def _cache_key(req: RideCompareRequest) -> str:
    platforms = sorted([p.value for p in (req.platforms or list(Platform))])
    return (
        f"rides:{req.origin.lat:.4f},{req.origin.lng:.4f}"
        f":{req.destination.lat:.4f},{req.destination.lng:.4f}"
        f":{','.join(platforms)}:{req.sort_by.value}"
    )


def _dto_to_response(dto: RideOptionDTO) -> RideOptionResponse:
    return RideOptionResponse(
        id=uuid.uuid4(),
        platform=dto.platform,
        ride_category=dto.ride_category,
        fare_estimate_ghs=dto.fare_estimate_ghs,
        fare_min_ghs=dto.fare_min_ghs,
        fare_max_ghs=dto.fare_max_ghs,
        eta_minutes=dto.eta_minutes,
        driver_rating=dto.driver_rating,
        drivers_nearby=dto.drivers_nearby,
        is_surge=dto.is_surge,
        surge_multiplier=dto.surge_multiplier,
        deep_link_url=dto.deep_link_url,
        road_distance_km=dto.road_distance_km,
        road_duration_min=dto.road_duration_min,
    )


async def compare_rides(
    request: RideCompareRequest,
    db: AsyncSession,
    user_id: Optional[uuid.UUID] = None,
    user_fcm_token: Optional[str] = None,
) -> RideComparisonResponse:
    redis = get_redis()
    cache_key = _cache_key(request)

    # 1. Cache check
    cached = await redis.get(cache_key)
    if cached:
        logger.debug("Cache hit", key=cache_key)
        return RideComparisonResponse(**json.loads(cached))

    # 2. Fan-out to adapters
    platforms_to_query = [p.value for p in (request.platforms or list(Platform))]
    adapters = {p: PLATFORM_ADAPTERS[p] for p in platforms_to_query if p in PLATFORM_ADAPTERS}

    results = await asyncio.gather(*[
        adapter.fetch_rides(
            request.origin.lat, request.origin.lng,
            request.destination.lat, request.destination.lng,
        )
        for adapter in adapters.values()
    ], return_exceptions=True)

    all_dtos: List[RideOptionDTO] = []
    for platform_name, result in zip(adapters.keys(), results):
        if isinstance(result, Exception):
            logger.error("Adapter failed", platform=platform_name, error=str(result))
            continue
        all_dtos.extend(result)

    if not all_dtos:
        raise RuntimeError("All platform adapters failed. No ride data available.")

    # Grab route info from the first DTO (all share same route)
    route_km  = all_dtos[0].road_distance_km
    route_min = all_dtos[0].road_duration_min

    # 3. Surge detection
    option_responses = [_dto_to_response(dto) for dto in all_dtos]
    is_surge, surge_warning = detect_surge(option_responses)

    # 4. Rank
    ranked_options, recommendation = rank_rides(option_responses, sort_by=request.sort_by)

    # 5. Persist
    comparison = RideComparison(
        user_id=user_id,
        origin_address=request.origin.address,
        origin_lat=request.origin.lat,
        origin_lng=request.origin.lng,
        destination_address=request.destination.address,
        destination_lat=request.destination.lat,
        destination_lng=request.destination.lng,
        route_distance_km=route_km,
        route_duration_min=route_min,
        is_surge_detected=is_surge,
    )
    db.add(comparison)
    await db.flush()

    ride_option_models = [
        RideOption(
            comparison_id=comparison.id,
            platform=dto.platform,
            ride_category=dto.ride_category,
            fare_estimate_ghs=dto.fare_estimate_ghs,
            fare_min_ghs=dto.fare_min_ghs,
            fare_max_ghs=dto.fare_max_ghs,
            eta_minutes=dto.eta_minutes,
            driver_rating=dto.driver_rating,
            drivers_nearby=dto.drivers_nearby,
            is_surge=dto.is_surge,
            surge_multiplier=dto.surge_multiplier,
            deep_link_url=dto.deep_link_url,
            road_distance_km=dto.road_distance_km,
            road_duration_min=dto.road_duration_min,
        )
        for dto in all_dtos
    ]
    db.add_all(ride_option_models)
    await db.flush()

    # Map DB IDs back onto responses
    ranked_with_ids = []
    for opt_resp in ranked_options:
        match = next(
            (m for m in ride_option_models
             if m.platform == opt_resp.platform and m.ride_category == opt_resp.ride_category),
            None,
        )
        ranked_with_ids.append(
            opt_resp.model_copy(update={"id": match.id}) if match else opt_resp
        )

    recommendation_with_id = ranked_with_ids[0] if ranked_with_ids else recommendation

    # Persist surge events
    if is_surge:
        await persist_surge_events(option_responses, db)

    # 6. Build + cache response
    response = RideComparisonResponse(
        id=comparison.id,
        origin_address=request.origin.address,
        destination_address=request.destination.address,
        is_surge_detected=is_surge,
        created_at=comparison.created_at,
        ride_options=ranked_with_ids,
        recommendation=recommendation_with_id,
        surge_warning=surge_warning,
        route_distance_km=route_km,
        route_duration_min=route_min,
    )

    await redis.setex(cache_key, settings.RIDE_CACHE_TTL_SECONDS, response.model_dump_json())

    # Fire FCM surge alert (non-blocking)
    if is_surge and user_fcm_token:
        surging_platforms = list({o.platform for o in option_responses if o.is_surge})
        mult = max((o.surge_multiplier for o in option_responses if o.is_surge), default=1.0)
        from app.services.notifications import send_surge_alert
        asyncio.create_task(send_surge_alert(
            device_token=user_fcm_token,
            platform_names=surging_platforms,
            multiplier=mult,
            origin=request.origin.address,
            destination=request.destination.address,
        ))

    logger.info(
        "Comparison complete",
        comparison_id=str(comparison.id),
        options=len(all_dtos),
        km=route_km,
        surge=is_surge,
    )
    return response


async def refresh_comparison_prices(
    comparison_id: str,
    db: AsyncSession,
) -> Optional[dict]:
    """
    Re-fetch live prices for an existing comparison (used by WebSocket handler).
    Returns a plain dict (JSON-serialisable) or None if comparison not found.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(RideComparison)
        .where(RideComparison.id == uuid.UUID(comparison_id))
        .options(selectinload(RideComparison.ride_options))
    )
    comparison = result.scalar_one_or_none()
    if not comparison:
        return None

    try:
        req = RideCompareRequest(
            origin={
                "address": comparison.origin_address,
                "lat": comparison.origin_lat,
                "lng": comparison.origin_lng,
            },
            destination={
                "address": comparison.destination_address,
                "lat": comparison.destination_lat,
                "lng": comparison.destination_lng,
            },
        )
        # Force cache bypass by generating fresh data
        platforms_to_query = list(PLATFORM_ADAPTERS.keys())
        results = await asyncio.gather(*[
            PLATFORM_ADAPTERS[p].fetch_rides(
                comparison.origin_lat, comparison.origin_lng,
                comparison.destination_lat, comparison.destination_lng,
            )
            for p in platforms_to_query
        ], return_exceptions=True)

        all_dtos: List[RideOptionDTO] = []
        for r in results:
            if not isinstance(r, Exception):
                all_dtos.extend(r)

        if not all_dtos:
            return None

        option_responses = [_dto_to_response(dto) for dto in all_dtos]
        is_surge, surge_warning = detect_surge(option_responses)
        ranked, recommendation = rank_rides(option_responses)

        return {
            "id": str(comparison.id),
            "origin_address": comparison.origin_address,
            "destination_address": comparison.destination_address,
            "is_surge_detected": is_surge,
            "surge_warning": surge_warning,
            "route_distance_km": all_dtos[0].road_distance_km,
            "route_duration_min": all_dtos[0].road_duration_min,
            "ride_options": [r.model_dump() for r in ranked],
            "recommendation": recommendation.model_dump() if recommendation else None,
        }

    except Exception as exc:
        logger.error("refresh_comparison_prices failed", comparison_id=comparison_id, error=str(exc))
        return None
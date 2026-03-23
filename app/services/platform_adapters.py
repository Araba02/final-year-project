"""
app/services/platform_adapters.py
───────────────────────────────────
Platform adapter layer.

Each adapter fetches (or simulates) ride options for one platform.
Fares are now computed from REAL Google Distance Matrix road distance
and drive time — not straight-line Haversine approximations.

Pricing model (GHS, calibrated for Accra 2024/2025):
  fare = base_fare
       + (road_distance_km  × rate_per_km)
       + (drive_time_min    × rate_per_min)   # time component
       × demand_multiplier                     # surge / time-of-day
       × category_comfort_factor

When real platform APIs become available, only the fetch_rides() body
needs to change — the DTO contract and the rest of the system are unchanged.
"""
from __future__ import annotations

import hashlib
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.ride import Platform
from app.services.google_maps import RouteInfo, get_route_info

logger = get_logger(__name__)


# ── Data transfer object ──────────────────────────────────────────────────────

@dataclass
class RideOptionDTO:
    platform: str
    ride_category: str
    fare_estimate_ghs: float
    fare_min_ghs: float
    fare_max_ghs: float
    eta_minutes: int
    driver_rating: float
    drivers_nearby: int
    is_surge: bool
    surge_multiplier: float
    deep_link_url: str
    road_distance_km: float   # ← now populated from Google
    road_duration_min: int    # ← now populated from Google


# ── Abstract base ─────────────────────────────────────────────────────────────

class AbstractPlatformAdapter(ABC):

    @abstractmethod
    async def fetch_rides(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
    ) -> List[RideOptionDTO]: ...

    @staticmethod
    def _route_seed(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
        key = f"{lat1:.4f},{lng1:.4f},{lat2:.4f},{lng2:.4f}"
        return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)

    @staticmethod
    def _demand_multiplier() -> float:
        """
        Time-of-day demand multiplier based on Accra traffic patterns.
        Morning rush: 07-09, Evening rush: 17-20, Late night: 23-01.
        """
        hour = datetime.now(timezone.utc).hour  # UTC ≈ GMT (Accra is GMT+0)
        if hour in {7, 8, 9, 17, 18, 19, 20}:
            return random.uniform(1.25, 1.65)
        if hour in {23, 0, 1}:
            return random.uniform(1.10, 1.40)
        if hour in {10, 11, 12, 13, 14}:
            return random.uniform(0.90, 1.10)
        return random.uniform(0.85, 1.05)

    def _compute_fare(
        self,
        route: RouteInfo,
        base_fare: float,
        rate_per_km: float,
        rate_per_min: float,
        comfort_factor: float,
        demand_mult: float,
        rng: random.Random,
    ) -> tuple[float, float, float]:
        """
        Returns (estimate, min, max) in GHS.
        Formula mirrors how Uber/Bolt actually price rides.
        """
        base = (
            base_fare
            + route.distance_km  * rate_per_km
            + route.duration_minutes * rate_per_min
        ) * comfort_factor * demand_mult
        variance = rng.uniform(0.95, 1.05)
        estimate = round(base * variance, 2)
        return estimate, round(estimate * 0.90, 2), round(estimate * 1.12, 2)


# ── Uber Adapter ──────────────────────────────────────────────────────────────

class UberAdapter(AbstractPlatformAdapter):
    """
    Simulates Uber Ghana.
    Pricing calibrated to Accra market rates (GHS, 2024).
    Deep-link uses official Uber URI scheme.
    """
    CATEGORIES = [
        # name, base, per_km, per_min, comfort_factor
        ("UberX",        1.50, 3.50, 0.25, 1.00),
        ("Uber Comfort", 2.50, 5.20, 0.35, 1.35),
        ("Uber XL",      3.00, 6.80, 0.45, 1.65),
    ]

    async def fetch_rides(self, origin_lat, origin_lng, destination_lat, destination_lng):
        route = await get_route_info(origin_lat, origin_lng, destination_lat, destination_lng)
        seed  = self._route_seed(origin_lat, origin_lng, destination_lat, destination_lng)
        rng   = random.Random(seed + int(datetime.now(timezone.utc).timestamp() // 30))
        mult  = self._demand_multiplier()
        surge = mult >= settings.SURGE_THRESHOLD_MULTIPLIER

        options = []
        for name, base, pkm, pmin, comfort in self.CATEGORIES:
            est, lo, hi = self._compute_fare(route, base, pkm, pmin, comfort, mult, rng)
            options.append(RideOptionDTO(
                platform="uber",
                ride_category=name,
                fare_estimate_ghs=est,
                fare_min_ghs=lo,
                fare_max_ghs=hi,
                eta_minutes=rng.randint(2, max(3, route.duration_minutes // 3)),
                driver_rating=round(rng.uniform(4.3, 4.9), 1),
                drivers_nearby=rng.randint(1, 8),
                is_surge=surge,
                surge_multiplier=round(mult, 2),
                deep_link_url=(
                    f"uber://?action=setPickup"
                    f"&pickup[latitude]={origin_lat}&pickup[longitude]={origin_lng}"
                    f"&dropoff[latitude]={destination_lat}&dropoff[longitude]={destination_lng}"
                ),
                road_distance_km=route.distance_km,
                road_duration_min=route.duration_minutes,
            ))

        logger.debug("Uber options", count=len(options), km=route.distance_km, surge=surge)
        return options


# ── Bolt Adapter ──────────────────────────────────────────────────────────────

class BoltAdapter(AbstractPlatformAdapter):
    """
    Simulates Bolt Ghana.
    Slightly cheaper than Uber — matches real market positioning.
    """
    CATEGORIES = [
        ("Bolt",         1.20, 3.00, 0.20, 1.00),
        ("Bolt Comfort", 2.00, 4.50, 0.30, 1.25),
        ("Bolt XL",      2.50, 5.80, 0.40, 1.55),
    ]

    async def fetch_rides(self, origin_lat, origin_lng, destination_lat, destination_lng):
        route = await get_route_info(origin_lat, origin_lng, destination_lat, destination_lng)
        seed  = self._route_seed(origin_lat, origin_lng, destination_lat, destination_lng)
        rng   = random.Random(seed + 1 + int(datetime.now(timezone.utc).timestamp() // 30))
        mult  = self._demand_multiplier()
        surge = mult >= settings.SURGE_THRESHOLD_MULTIPLIER

        options = []
        for name, base, pkm, pmin, comfort in self.CATEGORIES:
            est, lo, hi = self._compute_fare(route, base, pkm, pmin, comfort, mult, rng)
            options.append(RideOptionDTO(
                platform="bolt",
                ride_category=name,
                fare_estimate_ghs=est,
                fare_min_ghs=lo,
                fare_max_ghs=hi,
                eta_minutes=rng.randint(2, max(3, route.duration_minutes // 3)),
                driver_rating=round(rng.uniform(4.2, 4.8), 1),
                drivers_nearby=rng.randint(1, 10),
                is_surge=surge,
                surge_multiplier=round(mult, 2),
                deep_link_url=(
                    f"bolt://ride"
                    f"?pickup_lat={origin_lat}&pickup_lng={origin_lng}"
                    f"&destination_lat={destination_lat}&destination_lng={destination_lng}"
                ),
                road_distance_km=route.distance_km,
                road_duration_min=route.duration_minutes,
            ))

        logger.debug("Bolt options", count=len(options), km=route.distance_km, surge=surge)
        return options


# ── Yango Adapter ─────────────────────────────────────────────────────────────

class YangoAdapter(AbstractPlatformAdapter):
    """
    Simulates Yango Ghana.
    Budget positioning — cheapest base rate.
    """
    CATEGORIES = [
        ("Yango",      1.00, 2.80, 0.18, 1.00),
        ("Yango Plus", 1.80, 4.20, 0.28, 1.30),
    ]

    async def fetch_rides(self, origin_lat, origin_lng, destination_lat, destination_lng):
        route = await get_route_info(origin_lat, origin_lng, destination_lat, destination_lng)
        seed  = self._route_seed(origin_lat, origin_lng, destination_lat, destination_lng)
        rng   = random.Random(seed + 2 + int(datetime.now(timezone.utc).timestamp() // 30))
        mult  = self._demand_multiplier()
        surge = mult >= settings.SURGE_THRESHOLD_MULTIPLIER

        options = []
        for name, base, pkm, pmin, comfort in self.CATEGORIES:
            est, lo, hi = self._compute_fare(route, base, pkm, pmin, comfort, mult, rng)
            options.append(RideOptionDTO(
                platform="yango",
                ride_category=name,
                fare_estimate_ghs=est,
                fare_min_ghs=lo,
                fare_max_ghs=hi,
                eta_minutes=rng.randint(3, max(4, route.duration_minutes // 2)),
                driver_rating=round(rng.uniform(4.0, 4.7), 1),
                drivers_nearby=rng.randint(1, 6),
                is_surge=surge,
                surge_multiplier=round(mult, 2),
                deep_link_url=(
                    f"yango://order"
                    f"?startLat={origin_lat}&startLon={origin_lng}"
                    f"&endLat={destination_lat}&endLon={destination_lng}"
                ),
                road_distance_km=route.distance_km,
                road_duration_min=route.duration_minutes,
            ))

        logger.debug("Yango options", count=len(options), km=route.distance_km, surge=surge)
        return options


# ── Shaxi Adapter (Ghanaian local platform) ───────────────────────────────────

class ShaxiAdapter(AbstractPlatformAdapter):
    """
    Simulates Shaxi — a Ghanaian homegrown ride-hailing platform.
    Lower rates than international competitors; popular in Accra suburbs.
    """
    CATEGORIES = [
        ("Shaxi Go",      0.90, 2.50, 0.15, 1.00),
        ("Shaxi Premium", 1.60, 3.80, 0.25, 1.20),
    ]

    async def fetch_rides(self, origin_lat, origin_lng, destination_lat, destination_lng):
        route = await get_route_info(origin_lat, origin_lng, destination_lat, destination_lng)
        seed  = self._route_seed(origin_lat, origin_lng, destination_lat, destination_lng)
        rng   = random.Random(seed + 3 + int(datetime.now(timezone.utc).timestamp() // 30))
        mult  = self._demand_multiplier()
        surge = mult >= settings.SURGE_THRESHOLD_MULTIPLIER

        options = []
        for name, base, pkm, pmin, comfort in self.CATEGORIES:
            est, lo, hi = self._compute_fare(route, base, pkm, pmin, comfort, mult, rng)
            options.append(RideOptionDTO(
                platform="shaxi",
                ride_category=name,
                fare_estimate_ghs=est,
                fare_min_ghs=lo,
                fare_max_ghs=hi,
                eta_minutes=rng.randint(3, max(5, route.duration_minutes // 2)),
                driver_rating=round(rng.uniform(4.1, 4.6), 1),
                drivers_nearby=rng.randint(1, 5),
                is_surge=surge,
                surge_multiplier=round(mult, 2),
                deep_link_url=(
                    f"shaxi://book"
                    f"?from_lat={origin_lat}&from_lng={origin_lng}"
                    f"&to_lat={destination_lat}&to_lng={destination_lng}"
                ),
                road_distance_km=route.distance_km,
                road_duration_min=route.duration_minutes,
            ))

        logger.debug("Shaxi options", count=len(options), km=route.distance_km, surge=surge)
        return options


# ── Adapter registry ──────────────────────────────────────────────────────────

PLATFORM_ADAPTERS: dict[str, AbstractPlatformAdapter] = {
    "uber":  UberAdapter(),
    "bolt":  BoltAdapter(),
    "yango": YangoAdapter(),
    "shaxi": ShaxiAdapter(),
}
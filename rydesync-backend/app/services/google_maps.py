"""
app/services/google_maps.py
────────────────────────────
Google Maps Platform integration.

Wraps three APIs:
  1. Geocoding API        — text address → (lat, lng, formatted_address)
  2. Places Autocomplete  — partial text → ranked place suggestions
  3. Distance Matrix API  — origin+destination → real road distance (km) + drive time (min)

All calls are made with httpx async client.
Results are cached in Redis to minimise API quota consumption:
  - Geocode results   : 24 hours  (addresses don't move)
  - Autocomplete      : 5 minutes (suggestions change rarely)
  - Distance matrix   : 2 minutes (traffic changes, but not that fast)

Fallback:
  If GOOGLE_MAPS_API_KEY is empty (e.g. during tests), the service falls back
  to Haversine straight-line distance so the rest of the system keeps working.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from typing import List, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Google Maps API base URLs ─────────────────────────────────────────────────
_GEOCODE_URL       = "https://maps.googleapis.com/maps/api/geocode/json"
_AUTOCOMPLETE_URL  = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
_DISTANCE_URL      = "https://maps.googleapis.com/maps/api/distancematrix/json"

# Cache TTLs in seconds
_TTL_GEOCODE       = 86400   # 24 h
_TTL_AUTOCOMPLETE  = 300     # 5 min
_TTL_DISTANCE      = 120     # 2 min


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class GeocodedLocation:
    formatted_address: str
    lat: float
    lng: float
    place_id: str


@dataclass
class PlaceSuggestion:
    place_id: str
    description: str          # full formatted name
    main_text: str            # primary part (e.g. "Kotoka International Airport")
    secondary_text: str       # secondary part (e.g. "Accra, Ghana")


@dataclass
class RouteInfo:
    distance_km: float
    duration_minutes: int
    distance_text: str        # e.g. "7.2 km"
    duration_text: str        # e.g. "18 mins"
    origin_address: str
    destination_address: str


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_key(prefix: str, *parts: str) -> str:
    raw = "|".join(parts)
    digest = hashlib.md5(raw.encode()).hexdigest()[:12]
    return f"gmaps:{prefix}:{digest}"


async def _cache_get(key: str) -> Optional[dict]:
    try:
        from app.db.redis_client import get_redis
        redis = get_redis()
        data = await redis.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


async def _cache_set(key: str, value: dict, ttl: int) -> None:
    try:
        from app.db.redis_client import get_redis
        redis = get_redis()
        await redis.setex(key, ttl, json.dumps(value))
    except Exception:
        pass


# ── Haversine fallback ────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Public API ────────────────────────────────────────────────────────────────

async def geocode_address(address: str) -> Optional[GeocodedLocation]:
    """
    Convert a free-text address to coordinates using the Google Geocoding API.
    Biased to Ghana / Accra with a region hint.

    Returns None if the address cannot be resolved.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("GOOGLE_MAPS_API_KEY not set — geocoding unavailable")
        return None

    key = _cache_key("geocode", address.lower().strip())
    cached = await _cache_get(key)
    if cached:
        return GeocodedLocation(**cached)

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(_GEOCODE_URL, params={
                "address":  address,
                "region":   "gh",          # bias to Ghana
                "language": "en",
                "key":      settings.GOOGLE_MAPS_API_KEY,
            })
            resp.raise_for_status()
            data = resp.json()

        if data["status"] != "OK" or not data.get("results"):
            logger.warning("Geocoding failed", address=address, status=data["status"])
            return None

        result   = data["results"][0]
        location = result["geometry"]["location"]
        geo = GeocodedLocation(
            formatted_address=result["formatted_address"],
            lat=location["lat"],
            lng=location["lng"],
            place_id=result["place_id"],
        )
        await _cache_set(key, geo.__dict__, _TTL_GEOCODE)
        logger.debug("Geocoded", address=address, lat=geo.lat, lng=geo.lng)
        return geo

    except Exception as exc:
        logger.error("Geocoding error", address=address, error=str(exc))
        return None


async def autocomplete_places(
    query: str,
    session_token: Optional[str] = None,
) -> List[PlaceSuggestion]:
    """
    Return up to 5 place suggestions for a partial query string.
    Restricted to Ghana (components=country:GH) for relevance.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        return []

    key = _cache_key("autocomplete", query.lower().strip())
    cached = await _cache_get(key)
    if cached:
        return [PlaceSuggestion(**s) for s in cached]

    params: dict = {
        "input":      query,
        "components": "country:GH",
        "language":   "en",
        "types":      "geocode|establishment",
        "key":        settings.GOOGLE_MAPS_API_KEY,
    }
    if session_token:
        params["sessiontoken"] = session_token

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(_AUTOCOMPLETE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data["status"] not in ("OK", "ZERO_RESULTS"):
            logger.warning("Autocomplete failed", query=query, status=data["status"])
            return []

        suggestions = []
        for p in data.get("predictions", [])[:5]:
            st = p.get("structured_formatting", {})
            suggestions.append(PlaceSuggestion(
                place_id=p["place_id"],
                description=p["description"],
                main_text=st.get("main_text", p["description"]),
                secondary_text=st.get("secondary_text", ""),
            ))

        await _cache_set(key, [s.__dict__ for s in suggestions], _TTL_AUTOCOMPLETE)
        return suggestions

    except Exception as exc:
        logger.error("Autocomplete error", query=query, error=str(exc))
        return []


async def get_place_details(place_id: str) -> Optional[GeocodedLocation]:
    """
    Resolve a Google place_id to coordinates and a formatted address.
    Used after the user selects a suggestion from autocomplete.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        return None

    key = _cache_key("place", place_id)
    cached = await _cache_get(key)
    if cached:
        return GeocodedLocation(**cached)

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(_PLACE_DETAILS_URL, params={
                "place_id": place_id,
                "fields":   "geometry,formatted_address,place_id",
                "language": "en",
                "key":      settings.GOOGLE_MAPS_API_KEY,
            })
            resp.raise_for_status()
            data = resp.json()

        if data["status"] != "OK":
            return None

        result   = data["result"]
        location = result["geometry"]["location"]
        geo = GeocodedLocation(
            formatted_address=result["formatted_address"],
            lat=location["lat"],
            lng=location["lng"],
            place_id=result["place_id"],
        )
        await _cache_set(key, geo.__dict__, _TTL_GEOCODE)
        return geo

    except Exception as exc:
        logger.error("Place details error", place_id=place_id, error=str(exc))
        return None


async def get_route_info(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
) -> RouteInfo:
    """
    Get real road distance (km) and estimated drive time (minutes) using
    the Google Distance Matrix API.

    Falls back to Haversine + estimated speed (30 km/h urban average)
    if the API key is not configured or the call fails.
    """
    key = _cache_key(
        "distance",
        f"{origin_lat:.4f},{origin_lng:.4f}",
        f"{destination_lat:.4f},{destination_lng:.4f}",
    )
    cached = await _cache_get(key)
    if cached:
        return RouteInfo(**cached)

    # ── Attempt Google Distance Matrix ────────────────────────────────────────
    if settings.GOOGLE_MAPS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(_DISTANCE_URL, params={
                    "origins":      f"{origin_lat},{origin_lng}",
                    "destinations": f"{destination_lat},{destination_lng}",
                    "mode":         "driving",
                    "language":     "en",
                    "region":       "gh",
                    "key":          settings.GOOGLE_MAPS_API_KEY,
                })
                resp.raise_for_status()
                data = resp.json()

            element = data["rows"][0]["elements"][0]
            if element["status"] == "OK":
                dist_m   = element["distance"]["value"]   # metres
                dur_s    = element["duration"]["value"]   # seconds
                route = RouteInfo(
                    distance_km=round(dist_m / 1000, 2),
                    duration_minutes=round(dur_s / 60),
                    distance_text=element["distance"]["text"],
                    duration_text=element["duration"]["text"],
                    origin_address=data["origin_addresses"][0],
                    destination_address=data["destination_addresses"][0],
                )
                await _cache_set(key, route.__dict__, _TTL_DISTANCE)
                logger.debug(
                    "Distance Matrix result",
                    km=route.distance_km,
                    minutes=route.duration_minutes,
                )
                return route

        except Exception as exc:
            logger.warning("Distance Matrix API failed, using fallback", error=str(exc))

    # ── Haversine fallback ────────────────────────────────────────────────────
    dist_km  = _haversine_km(origin_lat, origin_lng, destination_lat, destination_lng)
    # Accra urban average speed ≈ 25 km/h (accounting for traffic)
    dur_min  = max(2, round((dist_km / 25) * 60))
    route = RouteInfo(
        distance_km=round(dist_km, 2),
        duration_minutes=dur_min,
        distance_text=f"{dist_km:.1f} km",
        duration_text=f"{dur_min} mins",
        origin_address=f"{origin_lat},{origin_lng}",
        destination_address=f"{destination_lat},{destination_lng}",
    )
    await _cache_set(key, route.__dict__, _TTL_DISTANCE)
    return route
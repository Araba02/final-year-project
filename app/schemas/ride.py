"""
app/schemas/ride.py
────────────────────
Request / response schemas for the ride comparison API.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SortCriteria(str, Enum):
    COST   = "cost"
    TIME   = "time"
    RATING = "rating"


class Platform(str, Enum):
    UBER  = "uber"
    BOLT  = "bolt"
    YANGO = "yango"
    SHAXI = "shaxi"


# ── Request schemas ───────────────────────────────────────────────────────────

class LocationInput(BaseModel):
    address: str = Field(..., min_length=2, max_length=500)
    lat: float   = Field(..., ge=-90,  le=90)
    lng: float   = Field(..., ge=-180, le=180)


class RideCompareRequest(BaseModel):
    origin:      LocationInput
    destination: LocationInput
    sort_by:     SortCriteria           = SortCriteria.COST
    platforms:   Optional[List[Platform]] = None   # None = all platforms


class PlaceAutocompleteRequest(BaseModel):
    query:         str = Field(..., min_length=2, max_length=200)
    session_token: Optional[str] = None


class GeocodeRequest(BaseModel):
    address: str = Field(..., min_length=3, max_length=500)


# ── Response schemas ──────────────────────────────────────────────────────────

class RideOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                 uuid.UUID
    platform:           str
    ride_category:      str
    fare_estimate_ghs:  float
    fare_min_ghs:       float
    fare_max_ghs:       float
    eta_minutes:        int
    driver_rating:      float
    drivers_nearby:     int
    is_surge:           bool
    surge_multiplier:   float
    deep_link_url:      str
    road_distance_km:   Optional[float] = None
    road_duration_min:  Optional[int]   = None


class RideComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                  uuid.UUID
    origin_address:      str
    destination_address: str
    is_surge_detected:   bool
    created_at:          datetime
    ride_options:        List[RideOptionResponse]
    recommendation:      Optional[RideOptionResponse] = None
    surge_warning:       Optional[str] = None
    route_distance_km:   Optional[float] = None
    route_duration_min:  Optional[int]   = None


class PlaceSuggestionResponse(BaseModel):
    place_id:       str
    description:    str
    main_text:      str
    secondary_text: str


class GeocodeResponse(BaseModel):
    formatted_address: str
    lat:               float
    lng:               float
    place_id:          str


# ── Surge / Analytics schemas ─────────────────────────────────────────────────

class SurgePredictionResponse(BaseModel):
    platform:              str
    predicted_hour:        int
    predicted_day_of_week: int
    surge_probability:     float
    risk_level:            str   # low | medium | high


class HistorySummaryResponse(BaseModel):
    total_comparisons:    int
    average_fare_ghs:     float
    surge_frequency_pct:  float
    most_used_platform:   str
    date_range_days:      int


class FareTrendPoint(BaseModel):
    date:              str    # ISO date string YYYY-MM-DD
    platform:          str
    avg_fare_ghs:      float
    comparison_count:  int


class FareTrendsResponse(BaseModel):
    points:        List[FareTrendPoint]
    date_range_days: int
    platforms:     List[str]
"""
app/api/v1/endpoints/locations.py
───────────────────────────────────
Google Maps location endpoints.

  GET  /locations/autocomplete   — place search suggestions as user types
  GET  /locations/geocode        — convert address string to lat/lng
  GET  /locations/place/{id}     — resolve a place_id to coordinates
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import settings
from app.schemas.ride import GeocodeResponse, PlaceSuggestionResponse
from app.services.google_maps import (
    autocomplete_places,
    geocode_address,
    get_place_details,
)

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get(
    "/autocomplete",
    response_model=List[PlaceSuggestionResponse],
    summary="Autocomplete a place name (restricted to Ghana)",
    description=(
        "Returns up to 5 ranked place suggestions for the given query string. "
        "Results are restricted to Ghana using the Google Places API. "
        "Pass a `session_token` (UUID) to group autocomplete + place_details "
        "calls into one billing session."
    ),
)
async def autocomplete(
    q: str = Query(..., min_length=2, max_length=200, description="Partial place name"),
    session_token: Optional[str] = Query(
        None, description="Optional session token for billing grouping"
    ),
):
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Location services are not configured on this server.",
        )

    suggestions = await autocomplete_places(q, session_token=session_token)
    return [
        PlaceSuggestionResponse(
            place_id=s.place_id,
            description=s.description,
            main_text=s.main_text,
            secondary_text=s.secondary_text,
        )
        for s in suggestions
    ]


@router.get(
    "/geocode",
    response_model=GeocodeResponse,
    summary="Convert an address string to GPS coordinates",
    description=(
        "Resolves a free-text address to a (lat, lng) coordinate pair "
        "using the Google Geocoding API. Biased to Ghana."
    ),
)
async def geocode(
    address: str = Query(..., min_length=3, max_length=500),
):
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Location services are not configured on this server.",
        )

    result = await geocode_address(address)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not geocode address: '{address}'. Try a more specific query.",
        )

    return GeocodeResponse(
        formatted_address=result.formatted_address,
        lat=result.lat,
        lng=result.lng,
        place_id=result.place_id,
    )


@router.get(
    "/place/{place_id}",
    response_model=GeocodeResponse,
    summary="Resolve a Google place_id to coordinates",
    description=(
        "Fetches the full location details for a place_id returned by "
        "the autocomplete endpoint. This completes the session-based "
        "autocomplete → place_details flow."
    ),
)
async def place_details(place_id: str):
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Location services are not configured on this server.",
        )

    result = await get_place_details(place_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Place ID '{place_id}' not found.",
        )

    return GeocodeResponse(
        formatted_address=result.formatted_address,
        lat=result.lat,
        lng=result.lng,
        place_id=result.place_id,
    )
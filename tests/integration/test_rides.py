"""
tests/integration/test_rides.py
─────────────────────────────────
Integration tests for the ride comparison and history endpoints.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

# ── Sample Accra locations ────────────────────────────────────────────────────
KOTOKA_AIRPORT = {
    "address": "Kotoka International Airport, Accra",
    "lat": 5.6052,
    "lng": -0.1668,
}
ACCRA_MALL = {
    "address": "Accra Mall, Spintex Road, Accra",
    "lat": 5.6360,
    "lng": -0.1632,
}
LEGON = {
    "address": "University of Ghana, Legon, Accra",
    "lat": 5.6502,
    "lng": -0.1864,
}

COMPARE_PAYLOAD = {
    "origin": KOTOKA_AIRPORT,
    "destination": ACCRA_MALL,
    "sort_by": "cost",
}


class TestRideComparison:
    async def test_compare_returns_200(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        assert response.status_code == 200

    async def test_compare_response_structure(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        data = response.json()

        assert "id" in data
        assert "origin_address" in data
        assert "destination_address" in data
        assert "ride_options" in data
        assert "recommendation" in data
        assert "is_surge_detected" in data
        assert isinstance(data["ride_options"], list)

    async def test_compare_returns_options_from_all_platforms(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        platforms = {o["platform"] for o in response.json()["ride_options"]}
        assert "uber" in platforms
        assert "bolt" in platforms
        assert "yango" in platforms

    async def test_compare_ride_options_have_required_fields(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        for option in response.json()["ride_options"]:
            assert "fare_estimate_ghs" in option
            assert "eta_minutes" in option
            assert "driver_rating" in option
            assert "deep_link_url" in option
            assert "is_surge" in option
            assert option["fare_estimate_ghs"] > 0
            assert option["eta_minutes"] > 0

    async def test_compare_recommendation_is_in_options(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        data = response.json()
        rec_id = data["recommendation"]["id"]
        option_ids = [o["id"] for o in data["ride_options"]]
        assert rec_id in option_ids

    async def test_compare_sort_by_time(self, client: AsyncClient):
        payload = {**COMPARE_PAYLOAD, "sort_by": "time"}
        response = await client.post("/api/v1/rides/compare", json=payload)
        assert response.status_code == 200
        data = response.json()
        recommendation = data["recommendation"]
        all_etas = [o["eta_minutes"] for o in data["ride_options"]]
        # Recommendation ETA should be among the lowest
        assert recommendation["eta_minutes"] <= sorted(all_etas)[1]

    async def test_compare_sort_by_rating(self, client: AsyncClient):
        payload = {**COMPARE_PAYLOAD, "sort_by": "rating"}
        response = await client.post("/api/v1/rides/compare", json=payload)
        assert response.status_code == 200
        assert response.json()["recommendation"]["driver_rating"] is not None

    async def test_compare_filter_single_platform(self, client: AsyncClient):
        payload = {**COMPARE_PAYLOAD, "platforms": ["uber"]}
        response = await client.post("/api/v1/rides/compare", json=payload)
        platforms = {o["platform"] for o in response.json()["ride_options"]}
        assert platforms == {"uber"}

    async def test_compare_invalid_payload_rejected(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json={
            "origin": {"address": "A", "lat": 999, "lng": 0},  # lat out of range
            "destination": ACCRA_MALL,
        })
        assert response.status_code == 422

    async def test_compare_deep_links_are_platform_specific(self, client: AsyncClient):
        response = await client.post("/api/v1/rides/compare", json=COMPARE_PAYLOAD)
        for option in response.json()["ride_options"]:
            platform = option["platform"]
            link = option["deep_link_url"]
            assert platform in link or any(
                kw in link for kw in ["uber://", "bolt://", "yango://"]
            )


class TestRideHistory:
    async def test_history_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/rides/history")
        assert response.status_code == 401

    async def test_history_empty_for_new_user(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.get("/api/v1/rides/history", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_history_records_authenticated_comparison(
        self, client: AsyncClient, auth_headers: dict
    ):
        # Make an authenticated comparison
        await client.post(
            "/api/v1/rides/compare",
            json=COMPARE_PAYLOAD,
            headers=auth_headers,
        )
        response = await client.get("/api/v1/rides/history", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    async def test_history_pagination(
        self, client: AsyncClient, auth_headers: dict
    ):
        # Make 3 comparisons
        for _ in range(3):
            await client.post(
                "/api/v1/rides/compare",
                json={
                    "origin": KOTOKA_AIRPORT,
                    "destination": LEGON,
                    "sort_by": "cost",
                },
                headers=auth_headers,
            )

        # Fetch with limit=2
        response = await client.get(
            "/api/v1/rides/history?limit=2&offset=0",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) <= 2

    async def test_get_comparison_by_id(
        self, client: AsyncClient, auth_headers: dict
    ):
        # Create a comparison
        create_resp = await client.post(
            "/api/v1/rides/compare",
            json=COMPARE_PAYLOAD,
            headers=auth_headers,
        )
        comparison_id = create_resp.json()["id"]

        # Retrieve by ID
        get_resp = await client.get(
            f"/api/v1/rides/history/{comparison_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == comparison_id

    async def test_get_nonexistent_comparison_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.get(
            f"/api/v1/rides/history/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

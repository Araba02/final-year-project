"""
tests/integration/test_analytics.py
──────────────────────────────────────
Integration tests for the analytics endpoints.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestSurgePredictions:
    async def test_predictions_returns_200(self, client: AsyncClient):
        response = await client.get("/api/v1/analytics/surge-predictions")
        assert response.status_code == 200

    async def test_predictions_returns_list(self, client: AsyncClient):
        response = await client.get("/api/v1/analytics/surge-predictions")
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_predictions_have_required_fields(self, client: AsyncClient):
        response = await client.get("/api/v1/analytics/surge-predictions")
        for prediction in response.json():
            assert "platform" in prediction
            assert "predicted_hour" in prediction
            assert "surge_probability" in prediction
            assert "risk_level" in prediction
            assert 0.0 <= prediction["surge_probability"] <= 1.0
            assert prediction["risk_level"] in {"low", "medium", "high"}

    async def test_predictions_covers_all_platforms(self, client: AsyncClient):
        response = await client.get("/api/v1/analytics/surge-predictions")
        platforms = {p["platform"] for p in response.json()}
        assert "uber" in platforms
        assert "bolt" in platforms
        assert "yango" in platforms

    async def test_predictions_filter_by_platform(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/analytics/surge-predictions?platform=uber"
        )
        assert response.status_code == 200
        platforms = {p["platform"] for p in response.json()}
        assert platforms == {"uber"}

    async def test_predictions_cover_24_hours_per_platform(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/analytics/surge-predictions?platform=bolt"
        )
        hours = [p["predicted_hour"] for p in response.json()]
        assert len(hours) == 24


class TestHistorySummary:
    async def test_summary_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/analytics/summary")
        assert response.status_code == 401

    async def test_summary_returns_zero_for_new_user(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.get(
            "/api/v1/analytics/summary",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_comparisons"] == 0

    async def test_summary_reflects_comparisons(
        self, client: AsyncClient, auth_headers: dict
    ):
        # Perform a comparison
        await client.post(
            "/api/v1/rides/compare",
            json={
                "origin": {
                    "address": "Accra Mall",
                    "lat": 5.6360,
                    "lng": -0.1632,
                },
                "destination": {
                    "address": "Kotoka Airport",
                    "lat": 5.6052,
                    "lng": -0.1668,
                },
                "sort_by": "cost",
            },
            headers=auth_headers,
        )

        response = await client.get(
            "/api/v1/analytics/summary",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_comparisons"] >= 1
        assert data["average_fare_ghs"] > 0
        assert "surge_frequency_pct" in data
        assert "most_used_platform" in data

    async def test_summary_custom_days_range(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.get(
            "/api/v1/analytics/summary?days=7",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["date_range_days"] == 7

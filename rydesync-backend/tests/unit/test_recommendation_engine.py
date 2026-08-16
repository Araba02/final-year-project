"""
tests/unit/test_recommendation_engine.py
─────────────────────────────────────────
Unit tests for the multi-criteria ranking algorithm.
No DB or network calls required.
"""
from __future__ import annotations

import uuid

import pytest

from app.schemas.ride import RideOptionResponse, SortCriteria
from app.services.recommendation_engine import rank_rides


def _make_option(platform, category, fare, eta, rating, surge=False) -> RideOptionResponse:
    return RideOptionResponse(
        id=uuid.uuid4(),
        platform=platform,
        ride_category=category,
        fare_estimate_ghs=fare,
        fare_min_ghs=fare * 0.9,
        fare_max_ghs=fare * 1.1,
        eta_minutes=eta,
        driver_rating=rating,
        drivers_nearby=3,
        is_surge=surge,
        surge_multiplier=1.4 if surge else 1.0,
        deep_link_url="uber://test",
    )


SAMPLE_OPTIONS = [
    _make_option("uber",  "UberX",        fare=35.0, eta=4,  rating=4.8),
    _make_option("bolt",  "Bolt",         fare=28.0, eta=7,  rating=4.5),
    _make_option("yango", "Yango",        fare=25.0, eta=10, rating=4.2),
    _make_option("uber",  "Uber Comfort", fare=50.0, eta=3,  rating=4.9),
]


class TestRankByCost:
    def test_cheapest_is_top_recommendation(self):
        ranked, recommendation = rank_rides(SAMPLE_OPTIONS, SortCriteria.COST)
        assert recommendation.fare_estimate_ghs == min(o.fare_estimate_ghs for o in SAMPLE_OPTIONS)

    def test_returns_all_options(self):
        ranked, _ = rank_rides(SAMPLE_OPTIONS, SortCriteria.COST)
        assert len(ranked) == len(SAMPLE_OPTIONS)

    def test_sorted_ascending_by_fare(self):
        ranked, _ = rank_rides(SAMPLE_OPTIONS, SortCriteria.COST)
        fares = [o.fare_estimate_ghs for o in ranked]
        # With cost-priority weights, generally expect cheaper options first
        assert fares[0] <= fares[-1]


class TestRankByTime:
    def test_fastest_is_top_recommendation(self):
        ranked, recommendation = rank_rides(SAMPLE_OPTIONS, SortCriteria.TIME)
        assert recommendation.eta_minutes == min(o.eta_minutes for o in SAMPLE_OPTIONS)


class TestRankByRating:
    def test_highest_rating_is_top_recommendation(self):
        ranked, recommendation = rank_rides(SAMPLE_OPTIONS, SortCriteria.RATING)
        assert recommendation.driver_rating == max(o.driver_rating for o in SAMPLE_OPTIONS)


class TestEdgeCases:
    def test_single_option_returns_itself(self):
        single = [_make_option("uber", "UberX", 30.0, 5, 4.5)]
        ranked, recommendation = rank_rides(single, SortCriteria.COST)
        assert len(ranked) == 1
        assert recommendation.platform == "uber"

    def test_empty_raises_value_error(self):
        with pytest.raises(ValueError, match="empty"):
            rank_rides([], SortCriteria.COST)

    def test_identical_fares_normalises_gracefully(self):
        identical = [
            _make_option("uber",  "UberX", 30.0, 5, 4.5),
            _make_option("bolt",  "Bolt",  30.0, 8, 4.3),
            _make_option("yango", "Yango", 30.0, 6, 4.1),
        ]
        ranked, recommendation = rank_rides(identical, SortCriteria.COST)
        assert len(ranked) == 3

"""
tests/unit/test_surge_detector.py
───────────────────────────────────
Unit tests for surge detection logic.
"""
from __future__ import annotations

import uuid

import pytest

from app.schemas.ride import RideOptionResponse
from app.services.surge_detector import detect_surge


def _option(platform, surge, multiplier):
    return RideOptionResponse(
        id=uuid.uuid4(),
        platform=platform,
        ride_category="Standard",
        fare_estimate_ghs=30.0,
        fare_min_ghs=27.0,
        fare_max_ghs=33.0,
        eta_minutes=5,
        driver_rating=4.5,
        drivers_nearby=3,
        is_surge=surge,
        surge_multiplier=multiplier,
        deep_link_url="uber://",
    )


class TestDetectSurge:
    def test_no_surge_when_all_normal(self):
        options = [
            _option("uber",  False, 1.0),
            _option("bolt",  False, 1.1),
            _option("yango", False, 1.05),
        ]
        is_surge, warning = detect_surge(options)
        assert is_surge is False
        assert warning is None

    def test_surge_detected_when_one_platform_surging(self):
        options = [
            _option("uber",  True,  1.5),
            _option("bolt",  False, 1.0),
        ]
        is_surge, warning = detect_surge(options)
        assert is_surge is True
        assert warning is not None
        assert "Uber" in warning

    def test_surge_warning_contains_risk_level(self):
        options = [_option("uber", True, 2.0)]
        _, warning = detect_surge(options)
        assert "very high" in warning.lower()

    def test_surge_warning_moderate_level(self):
        options = [_option("bolt", True, 1.35)]
        _, warning = detect_surge(options)
        assert "moderate" in warning.lower()

    def test_empty_options_returns_no_surge(self):
        is_surge, warning = detect_surge([])
        assert is_surge is False
        assert warning is None

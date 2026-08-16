"""
app/models/ride.py
──────────────────
Core domain models for ride comparison sessions and individual ride options.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class RideComparison(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    origin_address:      Mapped[str]   = mapped_column(String(500), nullable=False)
    origin_lat:          Mapped[float] = mapped_column(Float, nullable=False)
    origin_lng:          Mapped[float] = mapped_column(Float, nullable=False)
    destination_address: Mapped[str]   = mapped_column(String(500), nullable=False)
    destination_lat:     Mapped[float] = mapped_column(Float, nullable=False)
    destination_lng:     Mapped[float] = mapped_column(Float, nullable=False)

    # Real road metrics from Google Distance Matrix
    route_distance_km:  Mapped[float | None] = mapped_column(Float, nullable=True)
    route_duration_min: Mapped[int | None]   = mapped_column(Integer, nullable=True)

    is_surge_detected: Mapped[bool]     = mapped_column(Boolean, default=False, nullable=False)
    created_at:        Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user:         Mapped["User"]           = relationship("User", back_populates="ride_comparisons")  # noqa: F821
    ride_options: Mapped[list["RideOption"]] = relationship(
        "RideOption", back_populates="comparison", cascade="all, delete-orphan"
    )


class RideOption(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    comparison_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ride_comparisons.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    platform:          Mapped[str]   = mapped_column(String(50),  nullable=False)
    ride_category:     Mapped[str]   = mapped_column(String(100), nullable=False)
    fare_estimate_ghs: Mapped[float] = mapped_column(Float, nullable=False)
    fare_min_ghs:      Mapped[float] = mapped_column(Float, nullable=False)
    fare_max_ghs:      Mapped[float] = mapped_column(Float, nullable=False)
    eta_minutes:       Mapped[int]   = mapped_column(Integer, nullable=False)
    driver_rating:     Mapped[float] = mapped_column(Float, nullable=False)
    drivers_nearby:    Mapped[int]   = mapped_column(Integer, nullable=False)
    is_surge:          Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)
    surge_multiplier:  Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    deep_link_url:     Mapped[str]   = mapped_column(Text, nullable=False)

    # Road metrics per option (from Google, cached from parent comparison)
    road_distance_km:  Mapped[float | None] = mapped_column(Float, nullable=True)
    road_duration_min: Mapped[int | None]   = mapped_column(Integer, nullable=True)

    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    comparison: Mapped["RideComparison"] = relationship(
        "RideComparison", back_populates="ride_options"
    )
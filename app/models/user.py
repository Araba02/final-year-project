"""
app/models/user.py
──────────────────
User ORM model.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class User(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    full_name:       Mapped[str]  = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str]  = mapped_column(String(255), nullable=False)
    is_active:       Mapped[bool] = mapped_column(Boolean, default=True,  nullable=False)
    is_verified:     Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preferred_sort:  Mapped[str]  = mapped_column(String(20), default="cost", nullable=False)

    # FCM device token registered by the Flutter app for push notifications
    fcm_token: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ride_comparisons: Mapped[list["RideComparison"]] = relationship(  # noqa: F821
        "RideComparison", back_populates="user", cascade="all, delete-orphan"
    )
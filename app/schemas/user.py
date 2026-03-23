"""
app/schemas/user.py
────────────────────
Pydantic v2 schemas for User request/response validation.
Keeps ORM models decoupled from API contracts.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    preferred_sort: str = "cost"

    @field_validator("preferred_sort")
    @classmethod
    def validate_sort(cls, v: str) -> str:
        allowed = {"cost", "time", "rating"}
        if v not in allowed:
            raise ValueError(f"preferred_sort must be one of: {allowed}")
        return v


class UserCreate(UserBase):
    """Schema for POST /auth/register."""
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class UserUpdate(BaseModel):
    """Schema for PATCH /users/me — all fields optional."""
    full_name: Optional[str] = None
    preferred_sort: Optional[str] = None
    password: Optional[str] = None

    @field_validator("preferred_sort")
    @classmethod
    def validate_sort(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in {"cost", "time", "rating"}:
            raise ValueError("preferred_sort must be one of: cost, time, rating")
        return v


class UserResponse(UserBase):
    """Public-facing user representation — never exposes hashed_password."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

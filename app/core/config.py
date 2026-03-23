"""
app/core/config.py
──────────────────
Centralised application settings loaded from environment variables / .env file.
All configuration is typed and validated via Pydantic Settings.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any, List, Optional, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "RideSync+"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = False

    # ── API ───────────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[Union[AnyHttpUrl, str]] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "insecure-dev-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Mobile App API Key (for Flutter client auth) ──────────────────────────
    # The Flutter app must send this in X-API-Key header on every request.
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    MOBILE_API_KEY: str = "dev-mobile-api-key-change-in-production"

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "ridesync"
    POSTGRES_PASSWORD: str = "ridesync_dev_password"
    POSTGRES_DB: str = "ridesync_db"

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    RIDE_CACHE_TTL_SECONDS: int = 30

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # ── Celery ────────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── Google Maps Platform ──────────────────────────────────────────────────
    GOOGLE_MAPS_API_KEY: str = ""
    # Geocoding API  — converts addresses to lat/lng
    # Places API     — autocomplete + place details
    # Distance Matrix API — real road distance + drive time

    # ── Firebase Cloud Messaging (push notifications) ─────────────────────────
    # Path to your Firebase service account JSON file, OR the JSON string itself.
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None  # base64-encoded JSON for cloud envs

    # ── Rate limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_COMPARE_ANONYMOUS: str = "10/minute"
    RATE_LIMIT_COMPARE_AUTHENTICATED: str = "30/minute"
    RATE_LIMIT_GEOCODE: str = "60/minute"

    # ── Platform API Keys (optional — future real integration) ────────────────
    UBER_API_KEY: Optional[str] = None
    BOLT_API_KEY: Optional[str] = None
    YANGO_API_KEY: Optional[str] = None

    # ── Analytics ────────────────────────────────────────────────────────────
    SURGE_THRESHOLD_MULTIPLIER: float = 1.3
    PREDICTION_HISTORY_DAYS: int = 30

    # ── WebSocket ────────────────────────────────────────────────────────────
    WS_PRICE_REFRESH_SECONDS: int = 30   # how often to push updated prices
    WS_MAX_CONNECTIONS_PER_USER: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
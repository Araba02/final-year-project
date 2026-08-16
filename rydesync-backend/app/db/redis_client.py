"""
app/db/redis_client.py
───────────────────────
Redis connection pool for caching ride data.
A single pool is created at startup and reused across requests.
"""
from __future__ import annotations

from typing import Optional

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_redis_pool: Optional[aioredis.Redis] = None


async def init_redis() -> None:
    """Called at application startup to initialise the connection pool."""
    global _redis_pool
    _redis_pool = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        max_connections=20,
    )
    await _redis_pool.ping()
    logger.info("Redis connection established", url=settings.redis_url)


async def close_redis() -> None:
    """Called at application shutdown."""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None
        logger.info("Redis connection closed")


def get_redis() -> aioredis.Redis:
    """
    FastAPI dependency / utility to retrieve the shared Redis client.
    Raises RuntimeError if Redis has not been initialised.
    """
    if _redis_pool is None:
        raise RuntimeError("Redis pool is not initialised. Call init_redis() first.")
    return _redis_pool

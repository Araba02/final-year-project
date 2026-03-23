"""
app/db/sync_session.py
───────────────────────
Synchronous SQLAlchemy session for use in Celery tasks.

Celery workers run in forked processes. asyncpg (the async PostgreSQL
driver) does not survive a fork — its event loop state becomes invalid.
Celery tasks must use a plain synchronous session with psycopg2 instead.

This module provides:
  - sync_engine       : synchronous SQLAlchemy engine (psycopg2)
  - SyncSessionLocal  : synchronous session factory
  - get_sync_db()     : context manager yielding a session
"""
from __future__ import annotations

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

sync_engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


@contextmanager
def get_sync_db():
    """Context manager — use inside Celery tasks."""
    db: Session = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
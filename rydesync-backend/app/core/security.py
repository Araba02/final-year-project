"""
app/core/security.py
────────────────────
JWT creation/verification and password hashing utilities.
Uses python-jose for JWTs and passlib[bcrypt] for password hashing.

Compatibility note:
    passlib 1.7.4 attempts to read bcrypt.__about__.__version__ which was
    removed in bcrypt 4.x. The patch below injects the missing attribute
    before passlib initialises, silencing the "(trapped) error reading
    bcrypt version" warning without requiring a bcrypt downgrade.
"""
from __future__ import annotations

import warnings
from datetime import datetime, timedelta, timezone
from typing import Any

# ── Passlib / bcrypt 4.x compatibility patch ─────────────────────────────────
import bcrypt as _bcrypt_module
if not hasattr(_bcrypt_module, "__about__"):
    class _BcryptAbout:
        __version__ = _bcrypt_module.__version__
    _bcrypt_module.__about__ = _BcryptAbout()

warnings.filterwarnings("ignore", message=".*error reading bcrypt version.*")
# ─────────────────────────────────────────────────────────────────────────────

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password hashing ─────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return bcrypt hash of *plain_password*."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT ───────────────────────────────────────────────────────────────────────
def _create_token(subject: Any, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: Any) -> str:
    """Create a short-lived access token."""
    return _create_token(
        subject,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )


def create_refresh_token(subject: Any) -> str:
    """Create a long-lived refresh token."""
    return _create_token(
        subject,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.

    Raises:
        JWTError: if the token is invalid, expired, or tampered with.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
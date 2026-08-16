"""
app/services/notifications.py
───────────────────────────────
Push notification service supporting two delivery paths:

  1. Expo Push API  — used when the device token starts with
     "ExponentPushToken[".  Works in Expo Go and managed-workflow builds
     without any native Firebase configuration.  No SDK required — simple
     HTTPS POST to https://exp.host/--/api/v2/push/send.

  2. Firebase Cloud Messaging (FCM) — used for all other tokens (raw FCM
     device tokens from standalone / bare-workflow builds).  Requires the
     firebase-admin package and credentials in .env.

The send functions are fully async and never block the event loop — FCM's
synchronous SDK calls are wrapped in run_in_executor.

All sends are fire-and-forget: failures are logged but never raised to the
caller so a notification issue never interrupts a ride comparison.
"""
from __future__ import annotations

import asyncio
import base64
import json
from typing import Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Firebase singleton ────────────────────────────────────────────────────────

_firebase_app = None


def _init_firebase():
    """Lazy-initialise the Firebase Admin SDK singleton (idempotent)."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        if settings.FIREBASE_CREDENTIALS_JSON:
            raw  = base64.b64decode(settings.FIREBASE_CREDENTIALS_JSON).decode()
            cred = credentials.Certificate(json.loads(raw))
        elif settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        else:
            logger.warning(
                "Firebase credentials not configured — FCM disabled. "
                "Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON in .env."
            )
            return None

        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised")
        return _firebase_app

    except ImportError:
        logger.warning("firebase-admin not installed — FCM disabled")
        return None
    except Exception as exc:
        logger.error("Firebase init failed", error=str(exc))
        return None


# ── Expo Push API (no extra dependencies) ────────────────────────────────────

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def _send_expo_push(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    sound: str = "default",
    priority: str = "high",
) -> bool:
    """Send a push notification via Expo's push service."""
    payload = {
        "to":       token,
        "title":    title,
        "body":     body,
        "sound":    sound,
        "priority": priority,
    }
    if data:
        payload["data"] = {k: str(v) for k, v in data.items()}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)
            result = resp.json()

        # Expo returns {"data": {"status": "ok"}} on success
        status = result.get("data", {}).get("status", "")
        if status == "ok":
            logger.info("Expo push sent", token=token[:20] + "…", title=title)
            return True

        logger.warning("Expo push failed", response=result)
        return False

    except Exception as exc:
        logger.error("Expo push error", error=str(exc))
        return False


# ── Firebase FCM (firebase-admin SDK) ────────────────────────────────────────

async def _send_fcm(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    android_channel: str = "surge_alerts",
) -> bool:
    """Send a push notification via Firebase Admin SDK (async-safe)."""
    app = _init_firebase()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id=android_channel,
                    color="#ff4f9a",
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound="default", badge=1)
                )
            ),
            token=token,
        )

        # messaging.send() is synchronous — run in a thread pool so we don't
        # block the asyncio event loop.
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, messaging.send, message)

        logger.info("FCM push sent", token=token[:8] + "…", title=title)
        return True

    except Exception as exc:
        logger.error("FCM send failed", error=str(exc))
        return False


# ── Router: pick the right channel based on token format ─────────────────────

def _is_expo_token(token: str) -> bool:
    return token.startswith("ExponentPushToken[")


async def _dispatch(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    if _is_expo_token(token):
        return await _send_expo_push(token, title, body, data)
    return await _send_fcm(token, title, body, data)


# ── Public API ────────────────────────────────────────────────────────────────

async def send_surge_alert(
    device_token: str,
    platform_names: list[str],
    multiplier: float,
    origin: str,
    destination: str,
) -> bool:
    """
    Notify the user of active surge pricing on their last comparison route.
    Chooses Expo Push or FCM automatically based on the token format.
    """
    risk          = "Very High" if multiplier >= 1.8 else "High" if multiplier >= 1.5 else "Moderate"
    platforms_str = " & ".join(p.capitalize() for p in platform_names)

    return await _dispatch(
        token=device_token,
        title=f"⚡ Surge Alert — {risk}",
        body=(
            f"{platforms_str} fares are {multiplier:.1f}× normal on "
            f"{origin} → {destination}. Consider waiting 10–15 mins."
        ),
        data={
            "type":       "surge_alert",
            "multiplier": str(round(multiplier, 2)),
            "platforms":  ",".join(platform_names),
            "risk_level": risk.lower(),
        },
    )


async def send_ride_update(
    device_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """Generic push notification for ride status or price updates."""
    return await _dispatch(device_token, title, body, data)


async def send_multicast(
    device_tokens: list[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> int:
    """
    Send the same notification to multiple devices concurrently.
    Returns the number of successfully delivered messages.
    """
    if not device_tokens:
        return 0

    results = await asyncio.gather(
        *[_dispatch(t, title, body, data) for t in device_tokens[:500]],
        return_exceptions=True,
    )
    success = sum(1 for r in results if r is True)
    logger.info("Multicast sent", success=success, total=len(device_tokens))
    return success

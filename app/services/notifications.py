"""
app/services/notifications.py
───────────────────────────────
Firebase Cloud Messaging (FCM) push notification service.

Sends surge alerts and ride updates directly to the user's mobile device.
The Flutter app registers its FCM device token via POST /users/me/fcm-token,
which is stored in the users table and used here.

Requires:
  - A Firebase project with Cloud Messaging enabled (free)
  - A service account key JSON downloaded from Firebase Console
  - Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON in .env

Firebase Admin SDK is initialised once at app startup (lazy singleton).
All sends are fire-and-forget — failures are logged but never raised.
"""
from __future__ import annotations

import json
import base64
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_firebase_app = None


def _init_firebase():
    """Lazy-initialise the Firebase Admin SDK singleton."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        if settings.FIREBASE_CREDENTIALS_JSON:
            # Cloud-friendly: credentials stored as base64-encoded JSON string
            raw = base64.b64decode(settings.FIREBASE_CREDENTIALS_JSON).decode()
            cred = credentials.Certificate(json.loads(raw))
        elif settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        else:
            logger.warning(
                "Firebase credentials not configured — push notifications disabled. "
                "Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON in .env"
            )
            return None

        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised")
        return _firebase_app

    except ImportError:
        logger.warning("firebase-admin not installed — push notifications disabled")
        return None
    except Exception as exc:
        logger.error("Firebase init failed", error=str(exc))
        return None


async def send_surge_alert(
    device_token: str,
    platform_names: list[str],
    multiplier: float,
    origin: str,
    destination: str,
) -> bool:
    """
    Send a surge pricing alert push notification to a specific device.

    Returns True if sent successfully, False otherwise.
    """
    app = _init_firebase()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        risk = "very high" if multiplier >= 1.8 else "high" if multiplier >= 1.5 else "moderate"
        platforms_str = " & ".join(p.capitalize() for p in platform_names)

        message = messaging.Message(
            notification=messaging.Notification(
                title=f"Surge pricing alert — {risk.title()}",
                body=(
                    f"{platforms_str} fares are {multiplier:.1f}x normal "
                    f"for {origin} → {destination}. "
                    f"Consider waiting 10-15 mins."
                ),
            ),
            data={
                "type":       "surge_alert",
                "multiplier": str(round(multiplier, 2)),
                "platforms":  ",".join(platform_names),
                "risk_level": risk,
            },
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    icon="ic_surge_alert",
                    color="#E85D24",
                    channel_id="surge_alerts",
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound="default",
                        badge=1,
                    )
                )
            ),
            token=device_token,
        )

        messaging.send(message)
        logger.info(
            "Surge alert sent",
            token=device_token[:8] + "...",
            multiplier=multiplier,
        )
        return True

    except Exception as exc:
        logger.error("FCM send failed", error=str(exc))
        return False


async def send_ride_update(
    device_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """Generic push notification for ride status updates."""
    app = _init_firebase()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=device_token,
        )
        messaging.send(message)
        return True

    except Exception as exc:
        logger.error("FCM send failed", error=str(exc))
        return False


async def send_multicast(
    device_tokens: list[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> int:
    """
    Send the same notification to multiple devices (e.g. admin broadcast).
    Returns the number of successfully sent messages.
    """
    app = _init_firebase()
    if not app or not device_tokens:
        return 0

    try:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=device_tokens[:500],  # FCM max per call
        )
        response = messaging.send_each_for_multicast(message)
        logger.info(
            "Multicast sent",
            success=response.success_count,
            failure=response.failure_count,
        )
        return response.success_count

    except Exception as exc:
        logger.error("FCM multicast failed", error=str(exc))
        return 0
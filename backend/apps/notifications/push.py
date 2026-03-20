"""Firebase Cloud Messaging push notification service.

Handles initialization, single-token sends, multi-device delivery,
and topic-based broadcasting via the Firebase Admin SDK.
"""

import json
import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK from the FIREBASE_CREDENTIALS_JSON env var.

    The env var should contain the full JSON service-account key.
    This function is idempotent -- repeated calls return the cached app.
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError:
        logger.error("firebase-admin package is not installed")
        return None

    creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    if not creds_json:
        logger.warning(
            "FIREBASE_CREDENTIALS_JSON env var not set -- push notifications disabled"
        )
        return None

    try:
        creds_dict = json.loads(creds_json)
        cred = credentials.Certificate(creds_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return _firebase_app
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to parse Firebase credentials: %s", exc)
        return None
    except Exception as exc:
        logger.error("Failed to initialize Firebase: %s", exc)
        return None


def send_push_to_token(token, title, body, data=None, image=None):
    """Send a push notification to a single FCM token.

    Returns True on success, False on failure.
    When False is returned due to an invalid/expired token, the caller
    should mark the token as inactive.
    """
    app = init_firebase()
    if app is None:
        logger.debug("Firebase not initialized, skipping push to token")
        return False

    from firebase_admin import messaging
    from firebase_admin.exceptions import FirebaseError

    notification = messaging.Notification(
        title=title,
        body=body,
        image=image,
    )

    message = messaging.Message(
        notification=notification,
        token=token,
        data={k: str(v) for k, v in (data or {}).items()},
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                click_action="OPEN_NOTIFICATION",
                channel_id="delectable_notifications",
            ),
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(title=title, body=body),
                    sound="default",
                    badge=1,
                    mutable_content=True,
                ),
            ),
        ),
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(
                title=title,
                body=body,
                icon="/icons/icon-192.png",
                image=image,
            ),
        ),
    )

    try:
        response = messaging.send(message, app=app)
        logger.info("Push sent successfully: %s", response)
        return True
    except messaging.UnregisteredError:
        logger.warning("Token unregistered, should be deactivated: %s...", token[:20])
        return False
    except messaging.SenderIdMismatchError:
        logger.warning("Sender ID mismatch for token: %s...", token[:20])
        return False
    except FirebaseError as exc:
        logger.error("Firebase send error: %s", exc)
        return False
    except Exception as exc:
        logger.error("Unexpected error sending push: %s", exc)
        return False


def send_push_notification(user_id, title, body, data=None, image=None):
    """Send a push notification to all active devices for a user.

    Checks the user's notification preferences (push_enabled, quiet hours)
    before sending. Marks tokens as inactive when delivery fails with
    an unrecoverable error.

    Returns a dict with counts of successes and failures.
    """
    from .models import NotificationPreference
    from .models_device import DeviceToken
    from .services import is_in_quiet_hours

    from django.contrib.auth import get_user_model

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("User %s not found, skipping push", user_id)
        return {"sent": 0, "failed": 0, "skipped": True}

    # Check if push is enabled for this user
    try:
        prefs = NotificationPreference.objects.get(user=user)
        if not prefs.push_enabled:
            logger.debug("Push disabled for user %s", user_id)
            return {"sent": 0, "failed": 0, "skipped": True}
    except NotificationPreference.DoesNotExist:
        pass  # Default is push_enabled=True

    # Check quiet hours
    if is_in_quiet_hours(user):
        logger.debug("User %s is in quiet hours, skipping push", user_id)
        return {"sent": 0, "failed": 0, "skipped": True}

    # Get active device tokens
    tokens = DeviceToken.objects.filter(user=user, is_active=True)
    if not tokens.exists():
        logger.debug("No active device tokens for user %s", user_id)
        return {"sent": 0, "failed": 0, "skipped": False}

    sent = 0
    failed = 0
    tokens_to_deactivate = []

    for device_token in tokens:
        success = send_push_to_token(
            token=device_token.token,
            title=title,
            body=body,
            data=data,
            image=image,
        )
        if success:
            sent += 1
        else:
            failed += 1
            tokens_to_deactivate.append(device_token.pk)

    # Deactivate failed tokens in bulk
    if tokens_to_deactivate:
        DeviceToken.objects.filter(pk__in=tokens_to_deactivate).update(
            is_active=False
        )
        logger.info(
            "Deactivated %d failed tokens for user %s",
            len(tokens_to_deactivate),
            user_id,
        )

    return {"sent": sent, "failed": failed, "skipped": False}


def send_topic_notification(topic, title, body, data=None, image=None):
    """Send a push notification to all devices subscribed to a topic.

    Topics can be used for broadcast scenarios like trending alerts.
    """
    app = init_firebase()
    if app is None:
        logger.debug("Firebase not initialized, skipping topic notification")
        return False

    from firebase_admin import messaging
    from firebase_admin.exceptions import FirebaseError

    notification = messaging.Notification(
        title=title,
        body=body,
        image=image,
    )

    message = messaging.Message(
        notification=notification,
        topic=topic,
        data={k: str(v) for k, v in (data or {}).items()},
    )

    try:
        response = messaging.send(message, app=app)
        logger.info("Topic notification sent to '%s': %s", topic, response)
        return True
    except FirebaseError as exc:
        logger.error("Failed to send topic notification to '%s': %s", topic, exc)
        return False
    except Exception as exc:
        logger.error("Unexpected error sending topic notification: %s", exc)
        return False

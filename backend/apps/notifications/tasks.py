"""Celery tasks for the notifications app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_weekly_digest(self):
    """Generate and deliver weekly digest notifications to all opted-in users.

    Runs every Sunday at 10 AM UTC via Celery Beat. Collects each user's
    weekly activity summary (reviews, likes, streak status, badge progress,
    trending venues) and creates a digest notification.
    """
    from django.contrib.auth import get_user_model

    from apps.notifications.models import NotificationPreference
    from apps.notifications.services import create_notification, generate_digest_content

    User = get_user_model()

    # Find users who have digest enabled
    opted_in_user_ids = NotificationPreference.objects.filter(
        digest_enabled=True,
    ).values_list("user_id", flat=True)

    # Include users without preferences (default is digest_enabled=True)
    users_with_prefs = set(
        NotificationPreference.objects.values_list("user_id", flat=True)
    )
    all_user_ids = set(User.objects.filter(is_active=True).values_list("id", flat=True))
    users_without_prefs = all_user_ids - users_with_prefs

    target_user_ids = set(opted_in_user_ids) | users_without_prefs

    sent_count = 0
    error_count = 0

    for user_id in target_user_ids:
        try:
            user = User.objects.get(id=user_id, is_active=True)
            digest = generate_digest_content(user)

            # Skip users with no activity
            if (
                digest["reviews_this_week"] == 0
                and digest["likes_received"] == 0
                and not digest["trending_venues"]
            ):
                continue

            summary_parts = []
            if digest["reviews_this_week"]:
                summary_parts.append(
                    f"{digest['reviews_this_week']} review(s) this week"
                )
            if digest["likes_received"]:
                summary_parts.append(
                    f"{digest['likes_received']} like(s) received"
                )
            if digest["streak_days"]:
                summary_parts.append(f"{digest['streak_days']}-day streak")

            text = "Your weekly digest: " + ", ".join(summary_parts) if summary_parts else "Check out what's trending this week!"

            create_notification(
                recipient=user,
                notification_type="digest",
                text=text,
                priority="normal",
                channel="in_app",
                extra_data=digest,
                force_delivery=True,
            )
            sent_count += 1
        except Exception as exc:
            error_count += 1
            logger.error(
                "Failed to send weekly digest for user %s: %s",
                user_id,
                exc,
            )

    logger.info(
        "Weekly digest complete: %d sent, %d errors",
        sent_count,
        error_count,
    )
    return {"sent": sent_count, "errors": error_count}


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def process_notification_bundle(self, recipient_id, group_key):
    """Bundle recent notifications with the same group_key for a recipient.

    Called when multiple rapid-fire notifications arrive for the same
    context (e.g. "5 people liked your review").
    """
    from datetime import timedelta

    from django.utils import timezone

    from apps.notifications.models import Notification

    one_hour_ago = timezone.now() - timedelta(hours=1)

    try:
        notifications = (
            Notification.objects.filter(
                recipient_id=recipient_id,
                group_key=group_key,
                is_bundled=False,
                created_at__gte=one_hour_ago,
            )
            .order_by("created_at")
        )

        if notifications.count() <= 1:
            return {"bundled": False, "count": notifications.count()}

        # Keep the most recent one as the primary notification
        primary = notifications.last()
        others = notifications.exclude(pk=primary.pk)
        bundle_count = notifications.count()

        primary.is_bundled = True
        primary.bundle_count = bundle_count
        primary.text = f"{primary.text} (+{bundle_count - 1} more)"
        primary.save(update_fields=["is_bundled", "bundle_count", "text"])

        # Mark the others as bundled too so they don't show individually
        others.update(is_bundled=True)

        logger.info(
            "Bundled %d notifications for user %s, group %s",
            bundle_count,
            recipient_id,
            group_key,
        )
        return {"bundled": True, "count": bundle_count}

    except Exception as exc:
        logger.error(
            "Failed to bundle notifications for user %s: %s",
            recipient_id,
            exc,
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=10,
    acks_late=True,
)
def send_push_notification(self, notification_id):
    """Deliver a push notification to the user's device(s) via FCM.

    Reads the Notification record, checks user preferences, and dispatches
    through Firebase Cloud Messaging.
    """
    from django.utils import timezone

    from apps.notifications.models import Notification, NotificationPreference
    from apps.notifications.push import send_push_notification as fcm_send

    try:
        notification = Notification.objects.select_related("recipient").get(
            id=notification_id
        )
    except Notification.DoesNotExist:
        logger.warning("Notification %s not found, skipping push", notification_id)
        return {"sent": False, "reason": "not_found"}

    # Check if user has push enabled
    try:
        prefs = NotificationPreference.objects.get(user=notification.recipient)
        if not prefs.push_enabled:
            return {"sent": False, "reason": "push_disabled"}
    except NotificationPreference.DoesNotExist:
        pass  # Default is push_enabled=True

    push_data = {
        "notification_id": str(notification.id),
        "notification_type": notification.notification_type,
    }
    if notification.related_object_id:
        push_data["related_object_id"] = str(notification.related_object_id)

    result = fcm_send(
        user_id=str(notification.recipient_id),
        title=notification.notification_type.replace("_", " ").title(),
        body=notification.text[:200],
        data=push_data,
    )

    logger.info(
        "Push notification dispatched: [%s] %s -> %s (sent=%d, failed=%d)",
        notification.notification_type,
        notification.text[:80],
        notification.recipient_id,
        result.get("sent", 0),
        result.get("failed", 0),
    )

    notification.delivered_at = timezone.now()
    notification.save(update_fields=["delivered_at"])

    return {
        "sent": True,
        "notification_id": str(notification_id),
        "push_result": result,
    }


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    acks_late=True,
)
def send_push_notification_task(self, user_id, title, body, data=None):
    """Fire-and-forget Celery task for sending push to a user's devices.

    Called from services.create_notification via _dispatch_push.
    """
    from apps.notifications.push import send_push_notification as fcm_send

    try:
        result = fcm_send(
            user_id=user_id,
            title=title,
            body=body,
            data=data,
        )
        logger.info(
            "Push task completed for user %s: sent=%d, failed=%d",
            user_id,
            result.get("sent", 0),
            result.get("failed", 0),
        )
        return result
    except Exception as exc:
        logger.error("Push task failed for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)

"""Notification services for bundling, frequency caps, and delivery."""

from datetime import timedelta
from typing import Optional

from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from .models import Notification, NotificationPreference


def get_or_create_preferences(user) -> NotificationPreference:
    """Get or create notification preferences for a user."""
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    return prefs


def is_in_quiet_hours(user) -> bool:
    """Check if current time is within user's quiet hours."""
    try:
        prefs = NotificationPreference.objects.get(user=user)
    except NotificationPreference.DoesNotExist:
        return False

    if not prefs.quiet_hours_enabled:
        return False

    import pytz
    try:
        user_tz = pytz.timezone(prefs.timezone)
    except pytz.UnknownTimeZoneError:
        user_tz = pytz.UTC

    now = timezone.now().astimezone(user_tz).time()
    start = prefs.quiet_hours_start
    end = prefs.quiet_hours_end

    if start < end:
        return start <= now <= end
    else:
        # Wraps around midnight
        return now >= start or now <= end


def check_frequency_caps(user, notification_type: str) -> bool:
    """
    Check if notification should be delivered based on frequency caps.
    Returns True if notification should be delivered.
    """
    one_hour_ago = timezone.now() - timedelta(hours=1)

    # Max 10 notifications per hour total
    total_recent = Notification.objects.filter(
        recipient=user,
        created_at__gte=one_hour_ago,
    ).count()
    if total_recent >= 10:
        return False

    # Max 3 of same type per hour
    type_recent = Notification.objects.filter(
        recipient=user,
        notification_type=notification_type,
        created_at__gte=one_hour_ago,
    ).count()
    if type_recent >= 3:
        return False

    return True


def should_deliver_notification(user, notification_type: str) -> tuple[bool, Optional[str]]:
    """
    Determine if a notification should be delivered.
    Returns (should_deliver, reason_if_not).
    """
    # Check preference toggles
    prefs = get_or_create_preferences(user)

    type_to_pref = {
        "like": "likes_enabled",
        "comment": "comments_enabled",
        "follow": "follows_enabled",
        "mention": "mentions_enabled",
        "trending": "trending_enabled",
        "streak": "streaks_enabled",
        "badge": "badges_enabled",
        "nudge": "nudges_enabled",
        "digest": "digest_enabled",
        "nearby": "nearby_enabled",
    }

    pref_field = type_to_pref.get(notification_type)
    if pref_field and not getattr(prefs, pref_field, True):
        return False, "disabled_by_preference"

    # Check quiet hours
    if is_in_quiet_hours(user):
        return False, "quiet_hours"

    # Check frequency caps
    if not check_frequency_caps(user, notification_type):
        return False, "frequency_cap"

    return True, None


def create_notification(
    recipient,
    notification_type: str,
    text: str,
    actor=None,
    related_object_id=None,
    priority: str = "normal",
    channel: str = "in_app",
    group_key: str = "",
    extra_data: Optional[dict] = None,
    force_delivery: bool = False,
) -> Optional[Notification]:
    """
    Create a notification with bundling and frequency cap support.
    Returns the notification or None if suppressed.
    """
    # Check if should deliver
    if not force_delivery:
        should_deliver, reason = should_deliver_notification(recipient, notification_type)
        if not should_deliver:
            return None

    with transaction.atomic():
        # Check for bundling opportunity
        if group_key:
            one_hour_ago = timezone.now() - timedelta(hours=1)
            existing = Notification.objects.filter(
                recipient=recipient,
                group_key=group_key,
                is_bundled=False,
                created_at__gte=one_hour_ago,
            ).order_by("-created_at").first()

            if existing:
                # Bundle with existing notification
                existing.bundle_count += 1
                existing.is_bundled = True
                existing.text = f"{text} (+{existing.bundle_count - 1} more)"
                existing.save()
                return existing

        # Create new notification
        notification = Notification.objects.create(
            recipient=recipient,
            actor=actor,
            notification_type=notification_type,
            priority=priority,
            channel=channel,
            group_key=group_key,
            text=text,
            related_object_id=related_object_id,
            extra_data=extra_data or {},
        )

        return notification


def get_unread_count(user) -> int:
    """Get unread notification count for a user."""
    return Notification.objects.filter(recipient=user, is_read=False).count()


def generate_digest_content(user) -> dict:
    """Generate weekly digest content for a user."""
    from apps.feed.engine import trending_venues
    from apps.gamification.models import DiningStreak, UserBadge, UserXP
    from apps.reviews.models import Review

    one_week_ago = timezone.now() - timedelta(days=7)

    # Get user's reviews this week
    user_reviews = Review.objects.filter(
        user=user,
        created_at__gte=one_week_ago,
    ).count()

    # Get likes received this week
    from apps.reviews.models import ReviewLike
    likes_received = ReviewLike.objects.filter(
        review__user=user,
        created_at__gte=one_week_ago,
    ).count()

    # Get streak status
    try:
        streak = DiningStreak.objects.get(user=user)
        streak_days = streak.current_streak
    except DiningStreak.DoesNotExist:
        streak_days = 0

    # Get badge progress
    badges_near = UserBadge.objects.filter(
        user=user,
        is_unlocked=False,
    ).select_related("badge").order_by("-progress")[:3]

    badge_progress = [
        {
            "name": ub.badge.name,
            "progress": ub.progress,
            "required": ub.badge.requirement_value,
            "percent": int((ub.progress / ub.badge.requirement_value) * 100),
        }
        for ub in badges_near
    ]

    # Get trending venues
    try:
        trending = trending_venues(limit=5)
    except Exception:
        trending = []

    return {
        "reviews_this_week": user_reviews,
        "likes_received": likes_received,
        "streak_days": streak_days,
        "badge_progress": badge_progress,
        "trending_venues": trending,
    }

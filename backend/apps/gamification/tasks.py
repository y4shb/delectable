"""Celery tasks for the gamification app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def process_streak_check(self):
    """Check and update dining streaks for all active users.

    Runs daily at midnight UTC via Celery Beat. Identifies users whose
    streaks should be broken (no activity yesterday and no freeze available)
    and resets them. Also awards streak freezes to qualifying users.
    """
    from datetime import timedelta

    from django.utils import timezone

    from apps.gamification.models import DiningStreak
    from apps.notifications.services import create_notification

    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    try:
        streaks = DiningStreak.objects.filter(
            current_streak__gt=0,
        ).select_related("user")

        broken_count = 0
        warned_count = 0
        freeze_awarded = 0

        for streak in streaks.iterator():
            if streak.last_activity_date is None:
                continue

            days_since = (today - streak.last_activity_date).days

            if days_since >= 2:
                if streak.streak_freezes > 0:
                    # Use a freeze automatically
                    streak.streak_freezes -= 1
                    streak.last_activity_date = yesterday
                    streak.save(update_fields=["streak_freezes", "last_activity_date", "updated_at"])

                    create_notification(
                        recipient=streak.user,
                        notification_type="streak",
                        text=(
                            f"Streak freeze used! Your {streak.current_streak}-day "
                            f"streak is safe. {streak.streak_freezes} freeze(s) remaining."
                        ),
                        priority="high",
                    )
                    warned_count += 1
                else:
                    # Break the streak
                    old_streak = streak.current_streak
                    streak.current_streak = 0
                    streak.save(update_fields=["current_streak", "updated_at"])

                    create_notification(
                        recipient=streak.user,
                        notification_type="streak",
                        text=f"Your {old_streak}-day dining streak ended. Start a new one today!",
                        priority="normal",
                    )
                    broken_count += 1

            elif days_since == 1 and streak.streak_freezes == 0:
                # Warn users at risk of losing their streak
                if streak.current_streak >= 3:
                    create_notification(
                        recipient=streak.user,
                        notification_type="nudge",
                        text=(
                            f"Don't lose your {streak.current_streak}-day streak! "
                            "Post a review today to keep it going."
                        ),
                        priority="high",
                    )

            # Award streak freezes at milestones (every 7 days)
            if streak.current_streak > 0 and streak.current_streak % 7 == 0:
                if streak.earn_freeze():
                    streak.save(update_fields=["streak_freezes", "updated_at"])
                    freeze_awarded += 1

        logger.info(
            "Streak check complete: %d broken, %d freeze-saved, %d freezes awarded",
            broken_count,
            warned_count,
            freeze_awarded,
        )
        return {
            "broken": broken_count,
            "freeze_saved": warned_count,
            "freezes_awarded": freeze_awarded,
        }

    except Exception as exc:
        logger.error("Failed to process streak check: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def check_badge_progress(self, user_id):
    """Check all badge categories for a specific user and award new badges.

    Triggered asynchronously after user actions (review, follow, etc.)
    to avoid blocking the request.
    """
    from django.contrib.auth import get_user_model

    from apps.gamification.services import check_all_badges_for_user

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id, is_active=True)
    except User.DoesNotExist:
        logger.warning("User %s not found for badge check", user_id)
        return {"status": "skipped", "reason": "user_not_found"}

    try:
        unlocked = check_all_badges_for_user(user)
        badge_names = [b.name for b in unlocked]

        if badge_names:
            logger.info(
                "User %s unlocked badges: %s",
                user_id,
                ", ".join(badge_names),
            )

        return {
            "status": "success",
            "user_id": str(user_id),
            "badges_unlocked": badge_names,
        }

    except Exception as exc:
        logger.error("Failed to check badge progress for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)

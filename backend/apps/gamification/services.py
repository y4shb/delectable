"""Gamification services for XP, streaks, and badges."""

from datetime import date, timedelta
from typing import Optional

from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification

from .models import (
    ActivityDay,
    BadgeDefinition,
    DiningStreak,
    UserBadge,
    UserXP,
    XPTransaction,
)


def award_xp(
    user,
    reason: str,
    related_object_id=None,
    description: str = "",
    custom_amount: Optional[int] = None,
) -> dict:
    """
    Award XP to a user for an action.
    Returns dict with xp_awarded, new_total, leveled_up, new_level.
    """
    amount = custom_amount or XPTransaction.XP_AMOUNTS.get(reason, 0)
    if amount <= 0:
        return {"xp_awarded": 0, "new_total": 0, "leveled_up": False, "new_level": 1}

    with transaction.atomic():
        xp_profile, _ = UserXP.objects.get_or_create(user=user)

        # Create transaction record
        XPTransaction.objects.create(
            user=user,
            reason=reason,
            amount=amount,
            related_object_id=related_object_id,
            description=description,
        )

        # Update total XP
        xp_profile.total_xp += amount
        leveled_up = xp_profile.recalculate_level()
        xp_profile.save()

        # Sync level to User model
        if user.level != xp_profile.level:
            user.level = xp_profile.level
            user.save(update_fields=["level"])

        # Create level-up notification
        if leveled_up:
            Notification.objects.create(
                recipient=user,
                notification_type=Notification.NotificationType.LEVEL_UP,
                priority=Notification.Priority.HIGH,
                text=f"Congratulations! You reached Level {xp_profile.level}!",
                extra_data={"level": xp_profile.level},
            )
            # Bonus XP for leveling up
            XPTransaction.objects.create(
                user=user,
                reason="level_up",
                amount=XPTransaction.XP_AMOUNTS["level_up"],
                description=f"Reached Level {xp_profile.level}",
            )
            xp_profile.total_xp += XPTransaction.XP_AMOUNTS["level_up"]
            xp_profile.save()

        return {
            "xp_awarded": amount,
            "new_total": xp_profile.total_xp,
            "leveled_up": leveled_up,
            "new_level": xp_profile.level,
        }


def record_activity(user, activity_type: str, activity_date: Optional[date] = None) -> dict:
    """
    Record daily activity and update streak.
    Returns streak status dict.
    """
    if activity_date is None:
        activity_date = timezone.now().date()

    with transaction.atomic():
        # Update activity day
        activity_day, _ = ActivityDay.objects.get_or_create(
            user=user, date=activity_date
        )
        if activity_type == "review":
            activity_day.review_count += 1
        elif activity_type == "photo":
            activity_day.photo_count += 1
        elif activity_type == "comment":
            activity_day.comment_count += 1

        # Update total_xp for the day from XP transactions
        from django.db.models import Sum
        daily_xp = XPTransaction.objects.filter(
            user=user, created_at__date=activity_date
        ).aggregate(total=Sum("amount"))["total"] or 0
        activity_day.total_xp = daily_xp
        activity_day.save()

        # Update streak
        streak, _ = DiningStreak.objects.get_or_create(user=user)
        result = streak.check_and_update_streak(activity_date)

        # Award streak bonus every 7 days
        if result["streak_continued"] and streak.current_streak > 0 and streak.current_streak % 7 == 0:
            award_xp(user, "streak", description=f"{streak.current_streak}-day streak")
            streak.earn_freeze()

        streak.save()

        # Check badge progress
        check_badge_progress(user, "streak", streak.current_streak)

        return result


def check_badge_progress(user, requirement_type: str, current_value: int) -> list:
    """
    Check and update badge progress for a user.
    Returns list of newly unlocked badges.
    """
    unlocked_badges = []

    badge_defs = BadgeDefinition.objects.filter(
        requirement_type=requirement_type, is_active=True
    )

    for badge_def in badge_defs:
        user_badge, created = UserBadge.objects.get_or_create(
            user=user, badge=badge_def
        )

        if not user_badge.is_unlocked:
            user_badge.progress = min(current_value, badge_def.requirement_value)

            if current_value >= badge_def.requirement_value:
                user_badge.is_unlocked = True
                user_badge.unlocked_at = timezone.now()
                unlocked_badges.append(badge_def)

                # Award XP for badge
                award_xp(
                    user,
                    "badge",
                    related_object_id=badge_def.id,
                    description=f"Earned badge: {badge_def.name}",
                    custom_amount=badge_def.xp_reward,
                )

                # Create badge notification
                Notification.objects.create(
                    recipient=user,
                    notification_type=Notification.NotificationType.BADGE,
                    priority=Notification.Priority.HIGH,
                    text=f"You earned the {badge_def.name} badge!",
                    related_object_id=badge_def.id,
                    extra_data={
                        "badge_slug": badge_def.slug,
                        "badge_tier": badge_def.tier,
                        "badge_category": badge_def.category,
                    },
                )

            user_badge.save()

    return unlocked_badges


def check_all_badges_for_user(user) -> list:
    """Check all badge categories for a user and update progress."""
    from apps.reviews.models import Review

    unlocked_badges = []

    # Review count badges
    review_count = Review.objects.filter(user=user).count()
    unlocked_badges.extend(check_badge_progress(user, "review_count", review_count))

    # Photo count badges
    photo_count = Review.objects.filter(user=user, photo_url__isnull=False).exclude(photo_url="").count()
    unlocked_badges.extend(check_badge_progress(user, "photo_count", photo_count))

    # Venue count badges
    venue_count = Review.objects.filter(user=user).values("venue").distinct().count()
    unlocked_badges.extend(check_badge_progress(user, "venue_count", venue_count))

    # Follower count badges
    follower_count = user.followers_count
    unlocked_badges.extend(check_badge_progress(user, "follower_count", follower_count))

    # Streak badges
    try:
        streak = DiningStreak.objects.get(user=user)
        unlocked_badges.extend(check_badge_progress(user, "streak", streak.longest_streak))
    except DiningStreak.DoesNotExist:
        pass

    return unlocked_badges


def get_user_xp_summary(user) -> dict:
    """Get XP summary for a user."""
    try:
        xp_profile = UserXP.objects.get(user=user)
        level = xp_profile.level
        current_xp = xp_profile.total_xp
        xp_for_current = UserXP.xp_for_level(level)
        xp_for_next = UserXP.xp_for_level(level + 1) if level < 20 else current_xp

        return {
            "total_xp": current_xp,
            "level": level,
            "xp_in_level": current_xp - xp_for_current,
            "xp_to_next_level": xp_for_next - current_xp if level < 20 else 0,
            "level_progress": (current_xp - xp_for_current) / max(1, xp_for_next - xp_for_current) if level < 20 else 1.0,
        }
    except UserXP.DoesNotExist:
        return {
            "total_xp": 0,
            "level": 1,
            "xp_in_level": 0,
            "xp_to_next_level": 75,
            "level_progress": 0.0,
        }


def get_activity_grid(user, weeks: int = 52) -> list:
    """Get activity data for contribution grid (GitHub-style)."""
    # Validate weeks parameter to prevent DoS via excessive memory usage
    weeks = max(1, min(weeks, 104))  # Limit to 2 years max

    end_date = timezone.now().date()
    start_date = end_date - timedelta(weeks=weeks)

    activities = ActivityDay.objects.filter(
        user=user, date__gte=start_date, date__lte=end_date
    ).values("date", "review_count", "photo_count", "comment_count")

    activity_map = {a["date"]: a for a in activities}

    grid = []
    current = start_date
    while current <= end_date:
        if current in activity_map:
            a = activity_map[current]
            total = a["review_count"] + a["photo_count"] + a["comment_count"]
            level = min(4, total)  # 0-4 intensity levels
        else:
            level = 0
        grid.append({"date": current.isoformat(), "level": level})
        current += timedelta(days=1)

    return grid

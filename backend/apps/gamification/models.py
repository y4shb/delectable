import uuid
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index


class UserXP(models.Model):
    """Tracks user's total XP and level (1-20)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="xp_profile"
    )
    total_xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    xp_to_next_level = models.PositiveIntegerField(default=75)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_xp"

    def __str__(self):
        return f"{self.user.name} - Level {self.level} ({self.total_xp} XP)"

    @staticmethod
    def xp_for_level(level: int) -> int:
        """Calculate total XP required to reach a given level. Formula: 75 * level^1.8"""
        if level <= 1:
            return 0
        return int(75 * (level ** Decimal("1.8")))

    def recalculate_level(self) -> bool:
        """Recalculate level based on total XP. Returns True if leveled up."""
        old_level = self.level
        new_level = 1
        for lvl in range(2, 21):
            if self.total_xp >= self.xp_for_level(lvl):
                new_level = lvl
            else:
                break
        self.level = new_level
        if new_level < 20:
            self.xp_to_next_level = self.xp_for_level(new_level + 1) - self.total_xp
        else:
            self.xp_to_next_level = 0
        return new_level > old_level


class XPTransaction(models.Model):
    """Audit log for XP awards."""

    class XPReason(models.TextChoices):
        REVIEW = "review", "Posted Review"
        REVIEW_PHOTO = "review_photo", "Photo with Review"
        COMMENT = "comment", "Posted Comment"
        LIKE_GIVEN = "like_given", "Liked Review"
        LIKE_RECEIVED = "like_received", "Received Like"
        STREAK_BONUS = "streak", "Streak Bonus"
        BADGE_EARNED = "badge", "Badge Earned"
        LEVEL_UP_BONUS = "level_up", "Level Up Bonus"
        FIRST_REVIEW = "first_review", "First Review Bonus"
        REFERRAL = "referral", "Referral Bonus"

    XP_AMOUNTS = {
        "review": 100,
        "review_photo": 50,
        "comment": 25,
        "like_given": 10,
        "like_received": 15,
        "streak": 50,
        "badge": 200,
        "level_up": 100,
        "first_review": 200,
        "referral": 150,
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="xp_transactions"
    )
    reason = models.CharField(max_length=20, choices=XPReason.choices)
    amount = models.IntegerField()
    related_object_id = models.UUIDField(null=True, blank=True)
    description = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "xp_transactions"
        ordering = ["-created_at"]
        indexes = [
            Index(name="idx_xp_user", fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.name} +{self.amount} XP ({self.reason})"


class DiningStreak(models.Model):
    """Tracks user's dining activity streak."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dining_streak"
    )
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    streak_freezes = models.PositiveIntegerField(default=0)
    max_freezes = models.PositiveIntegerField(default=2)
    last_activity_date = models.DateField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default="UTC")
    grace_hours = models.PositiveIntegerField(default=4)
    flexible_mode = models.BooleanField(default=False)
    weekly_activity_count = models.PositiveIntegerField(default=0)
    week_start_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dining_streaks"

    def __str__(self):
        return f"{self.user.name} - {self.current_streak} day streak"

    def check_and_update_streak(self, activity_date: date) -> dict:
        """
        Check and update streak based on new activity.
        Returns dict with streak_continued, streak_broken, freeze_used, leveled_up.
        """
        result = {
            "streak_continued": False,
            "streak_broken": False,
            "freeze_used": False,
            "new_streak": self.current_streak,
        }

        if self.last_activity_date is None:
            self.current_streak = 1
            self.last_activity_date = activity_date
            result["streak_continued"] = True
            result["new_streak"] = 1
            return result

        days_since = (activity_date - self.last_activity_date).days

        if days_since == 0:
            # Same day, no change
            return result
        elif days_since == 1:
            # Consecutive day
            self.current_streak += 1
            self.last_activity_date = activity_date
            result["streak_continued"] = True
            result["new_streak"] = self.current_streak
        elif days_since == 2 and self.streak_freezes > 0:
            # Missed one day but have freeze
            self.streak_freezes -= 1
            self.current_streak += 1
            self.last_activity_date = activity_date
            result["streak_continued"] = True
            result["freeze_used"] = True
            result["new_streak"] = self.current_streak
        else:
            # Streak broken
            result["streak_broken"] = True
            self.current_streak = 1
            self.last_activity_date = activity_date
            result["new_streak"] = 1

        # Update longest streak
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak

        return result

    def earn_freeze(self) -> bool:
        """Award a freeze if under max. Returns True if awarded."""
        if self.streak_freezes < self.max_freezes:
            self.streak_freezes += 1
            return True
        return False


class ActivityDay(models.Model):
    """Tracks daily activity for contribution grid."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_days"
    )
    date = models.DateField()
    review_count = models.PositiveIntegerField(default=0)
    photo_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    total_xp = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "activity_days"
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="uq_activity_day"),
        ]
        indexes = [
            Index(name="idx_activity_user_date", fields=["user", "-date"]),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.date}"


class BadgeDefinition(models.Model):
    """Definition of an achievement badge."""

    class Category(models.TextChoices):
        EXPLORER = "explorer", "Explorer"
        FOODIE = "foodie", "Foodie"
        SOCIAL = "social", "Social"
        STREAK = "streak", "Streak"
        PHOTOGRAPHER = "photographer", "Photographer"
        CURATOR = "curator", "Curator"
        REVIEWER = "reviewer", "Reviewer"
        LOCAL = "local", "Local Expert"

    class Tier(models.TextChoices):
        BRONZE = "bronze", "Bronze"
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"
        PLATINUM = "platinum", "Platinum"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    tier = models.CharField(max_length=10, choices=Tier.choices)
    icon_url = models.URLField(max_length=500, blank=True, default="")
    requirement_type = models.CharField(max_length=50)
    requirement_value = models.PositiveIntegerField()
    xp_reward = models.PositiveIntegerField(default=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "badge_definitions"
        ordering = ["category", "tier", "requirement_value"]

    def __str__(self):
        return f"{self.name} ({self.tier})"


class UserBadge(models.Model):
    """Badge earned by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(
        BadgeDefinition, on_delete=models.CASCADE, related_name="user_badges"
    )
    progress = models.PositiveIntegerField(default=0)
    is_unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    is_displayed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_badges"
        constraints = [
            models.UniqueConstraint(fields=["user", "badge"], name="uq_user_badge"),
        ]
        indexes = [
            Index(name="idx_badge_user", fields=["user", "is_unlocked"]),
        ]

    def __str__(self):
        status = "unlocked" if self.is_unlocked else f"{self.progress}/{self.badge.requirement_value}"
        return f"{self.user.name} - {self.badge.name} ({status})"


class LeaderboardEntry(models.Model):
    """Leaderboard entry for rankings."""

    class BoardType(models.TextChoices):
        GLOBAL = "global", "Global"
        CITY = "city", "City"
        FRIENDS = "friends", "Friends"
        CUISINE = "cuisine", "Cuisine"

    class Period(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        ALL_TIME = "all_time", "All Time"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leaderboard_entries"
    )
    board_type = models.CharField(max_length=10, choices=BoardType.choices)
    period = models.CharField(max_length=10, choices=Period.choices)
    scope = models.CharField(max_length=100, blank=True, default="")
    score = models.PositiveIntegerField(default=0)
    rank = models.PositiveIntegerField(default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leaderboard_entries"
        indexes = [
            Index(
                name="idx_leaderboard",
                fields=["board_type", "period", "scope", "-score"],
            ),
        ]

    def __str__(self):
        return f"{self.user.name} - #{self.rank} ({self.board_type}/{self.period})"


class WrappedStats(models.Model):
    """Annual 'Year in Review' statistics."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wrapped_stats"
    )
    year = models.PositiveIntegerField()
    total_reviews = models.PositiveIntegerField(default=0)
    total_venues = models.PositiveIntegerField(default=0)
    total_photos = models.PositiveIntegerField(default=0)
    total_xp = models.PositiveIntegerField(default=0)
    levels_gained = models.PositiveIntegerField(default=0)
    badges_earned = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    top_cuisine = models.CharField(max_length=100, blank=True, default="")
    top_venue = models.CharField(max_length=200, blank=True, default="")
    top_venue_visits = models.PositiveIntegerField(default=0)
    total_likes_received = models.PositiveIntegerField(default=0)
    total_comments_received = models.PositiveIntegerField(default=0)
    new_followers = models.PositiveIntegerField(default=0)
    stats_data = models.JSONField(default=dict, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wrapped_stats"
        constraints = [
            models.UniqueConstraint(fields=["user", "year"], name="uq_wrapped_year"),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.year} Wrapped"


class UserStatsCache(models.Model):
    """Cached activity dashboard statistics (refreshed daily)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stats_cache"
    )
    total_reviews = models.PositiveIntegerField(default=0)
    total_venues = models.PositiveIntegerField(default=0)
    total_photos = models.PositiveIntegerField(default=0)
    total_likes_given = models.PositiveIntegerField(default=0)
    total_likes_received = models.PositiveIntegerField(default=0)
    total_comments = models.PositiveIntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    favorite_cuisine = models.CharField(max_length=100, blank=True, default="")
    review_this_week = models.PositiveIntegerField(default=0)
    review_this_month = models.PositiveIntegerField(default=0)
    last_refreshed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_stats_cache"

    def __str__(self):
        return f"Stats for {self.user.name}"

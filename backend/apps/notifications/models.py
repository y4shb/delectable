import uuid
from datetime import time

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index


class Notification(models.Model):
    """User notification for social events with enhanced metadata."""

    class NotificationType(models.TextChoices):
        LIKE = "like", "Like"
        COMMENT = "comment", "Comment"
        FOLLOW = "follow", "Follow"
        PLAYLIST_ADD = "playlist_add", "Playlist Add"
        MENTION = "mention", "Mention"
        TRENDING = "trending", "Trending"
        STREAK = "streak", "Streak"
        BADGE = "badge", "Badge"
        NUDGE = "nudge", "Nudge"
        DIGEST = "digest", "Digest"
        LEVEL_UP = "level_up", "Level Up"
        NEARBY = "nearby", "Nearby Venue"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Channel(models.TextChoices):
        IN_APP = "in_app", "In-App"
        PUSH = "push", "Push"
        EMAIL = "email", "Email"
        SMS = "sms", "SMS"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
    )
    notification_type = models.CharField(
        max_length=20, choices=NotificationType.choices
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.NORMAL
    )
    channel = models.CharField(
        max_length=10, choices=Channel.choices, default=Channel.IN_APP
    )
    group_key = models.CharField(max_length=100, blank=True, default="")
    text = models.CharField(max_length=500)
    related_object_id = models.UUIDField(null=True, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    is_bundled = models.BooleanField(default=False)
    bundle_count = models.PositiveIntegerField(default=1)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            Index(
                name="idx_notification_feed",
                fields=["recipient", "is_read", "-created_at"],
            ),
            Index(
                name="idx_notification_bundle",
                fields=["recipient", "group_key", "-created_at"],
            ),
            Index(
                name="idx_notification_scheduled",
                fields=["scheduled_for"],
            ),
            models.Index(fields=['recipient', '-created_at'], name='idx_notif_recipient'),
            models.Index(
                fields=['recipient'],
                name='idx_notif_unread',
                condition=models.Q(is_read=False),
            ),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient}: {self.text[:50]}"


class NotificationPreference(models.Model):
    """User preferences for notification delivery."""

    class Frequency(models.TextChoices):
        INSTANT = "instant", "Instant"
        HOURLY = "hourly", "Hourly"
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        NEVER = "never", "Never"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Per-category preferences
    likes_enabled = models.BooleanField(default=True)
    comments_enabled = models.BooleanField(default=True)
    follows_enabled = models.BooleanField(default=True)
    mentions_enabled = models.BooleanField(default=True)
    trending_enabled = models.BooleanField(default=True)
    streaks_enabled = models.BooleanField(default=True)
    badges_enabled = models.BooleanField(default=True)
    nudges_enabled = models.BooleanField(default=True)
    digest_enabled = models.BooleanField(default=True)
    nearby_enabled = models.BooleanField(default=True)

    # Frequency settings
    social_frequency = models.CharField(
        max_length=10, choices=Frequency.choices, default=Frequency.INSTANT
    )
    digest_frequency = models.CharField(
        max_length=10, choices=Frequency.choices, default=Frequency.WEEKLY
    )

    # Channel preferences
    push_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=False)
    sms_enabled = models.BooleanField(default=False)

    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(default=time(22, 0))
    quiet_hours_end = models.TimeField(default=time(8, 0))
    timezone = models.CharField(max_length=50, default="UTC")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_preferences"

    def __str__(self):
        return f"NotificationPreference for {self.user}"


class VenueSaveReminder(models.Model):
    """Reminder for saved venues the user hasn't visited yet."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="venue_reminders"
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="save_reminders"
    )
    reminder_sent = models.BooleanField(default=False)
    trigger_after = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "venue_save_reminders"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue"],
                name="uq_venue_save_reminder",
            ),
        ]

    def __str__(self):
        return f"Reminder: {self.user} - {self.venue}"

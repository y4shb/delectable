import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index


class Notification(models.Model):
    """User notification for social events."""

    class NotificationType(models.TextChoices):
        LIKE = "like", "Like"
        COMMENT = "comment", "Comment"
        FOLLOW = "follow", "Follow"
        PLAYLIST_ADD = "playlist_add", "Playlist Add"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=20, choices=NotificationType.choices
    )
    text = models.CharField(max_length=500)
    related_object_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            Index(
                name="idx_notification_feed",
                fields=["recipient", "is_read", "-created_at"],
            ),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient}: {self.text[:50]}"

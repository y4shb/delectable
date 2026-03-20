"""Device token model for push notification delivery."""

import uuid

from django.conf import settings
from django.db import models


class DeviceToken(models.Model):
    """Stores FCM device tokens for push notification delivery.

    Each user may have multiple tokens (one per device/browser).
    Tokens are deactivated when they fail delivery.
    """

    PLATFORM_CHOICES = [
        ("web", "Web"),
        ("ios", "iOS"),
        ("android", "Android"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )
    token = models.TextField(unique=True)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_tokens"
        indexes = [
            models.Index(
                fields=["user", "is_active"],
                name="idx_device_token_user_active",
            ),
        ]

    def __str__(self):
        return f"DeviceToken({self.platform}) for {self.user} [{'active' if self.is_active else 'inactive'}]"

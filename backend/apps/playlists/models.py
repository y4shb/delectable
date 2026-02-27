import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index

from apps.core.models import TimeStampedModel


class Playlist(TimeStampedModel):
    """User-curated collection of venues."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlists"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True, default="")
    items_count = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)

    class Meta:
        db_table = "playlists"
        ordering = ["-updated_at"]
        indexes = [
            Index(name="idx_playlist_user_updated", fields=["user", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.title} by {self.user}"


class PlaylistItem(models.Model):
    """Item in a playlist — links a venue to a playlist with ordering."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="items"
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="playlist_items"
    )
    caption = models.CharField(max_length=300, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "playlist_items"
        ordering = ["sort_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["playlist", "venue"],
                name="uq_playlistitem_playlist_venue",
            ),
        ]
        indexes = [
            Index(name="idx_playlistitem_sort", fields=["playlist", "sort_order"]),
        ]

    def __str__(self):
        return f"{self.venue} in {self.playlist}"

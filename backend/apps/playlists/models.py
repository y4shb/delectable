import secrets
import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


def generate_share_code():
    """Generate a unique 6-character share code."""
    return secrets.token_urlsafe(4)[:6].lower()


class PlaylistVisibility(models.TextChoices):
    """Visibility options for playlists."""
    PUBLIC = 'public', 'Public'
    PRIVATE = 'private', 'Private'
    FOLLOWERS = 'followers', 'Followers Only'


class Playlist(TimeStampedModel):
    """User-curated collection of venues."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlists"
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(max_length=1000, blank=True, default="")
    items_count = models.PositiveIntegerField(default=0)
    visibility = models.CharField(
        max_length=20,
        choices=PlaylistVisibility.choices,
        default=PlaylistVisibility.PUBLIC,
    )
    share_code = models.CharField(max_length=10, unique=True, default=generate_share_code)
    fork_count = models.PositiveIntegerField(default=0)
    save_count = models.PositiveIntegerField(default=0)
    forked_from = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="forks"
    )

    @property
    def is_public(self):
        """Backwards compatibility property."""
        return self.visibility == PlaylistVisibility.PUBLIC

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:200]
            self.slug = f"{base_slug}-{generate_share_code()}"
        super().save(*args, **kwargs)

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


class SavedPlaylist(models.Model):
    """
    Saved (bookmarked) playlist - stays synced with original.
    User can view but not edit. Updates from original owner are reflected.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_playlists"
    )
    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="saves"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_playlists"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "playlist"],
                name="uq_saved_playlist_user_playlist",
            ),
        ]
        indexes = [
            Index(name="idx_saved_playlist_user", fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user} saved {self.playlist}"

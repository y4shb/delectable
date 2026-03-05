from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import VenueListSerializer

from .models import Playlist, PlaylistItem, SavedPlaylist


class PlaylistItemSerializer(serializers.ModelSerializer):
    """Playlist item with embedded venue."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = PlaylistItem
        fields = ["id", "venue", "venue_detail", "caption", "sort_order", "created_at"]
        read_only_fields = ["id", "sort_order", "created_at"]


class ForkedFromSerializer(serializers.ModelSerializer):
    """Minimal serializer for forked_from reference."""

    owner = UserPublicSerializer(source="user", read_only=True)

    class Meta:
        model = Playlist
        fields = ["id", "title", "owner"]


class PlaylistSerializer(serializers.ModelSerializer):
    """Full playlist with embedded items and owner."""

    owner = UserPublicSerializer(source="user", read_only=True)
    items = PlaylistItemSerializer(many=True, read_only=True)
    forked_from = ForkedFromSerializer(read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            "id", "owner", "title", "description", "visibility",
            "items_count", "save_count", "fork_count", "items",
            "forked_from", "is_saved", "is_owner",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "owner", "items_count", "save_count", "fork_count",
            "items", "forked_from", "is_saved", "is_owner",
            "created_at", "updated_at",
        ]

    def get_is_saved(self, obj):
        """Check if current user has saved this playlist."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return SavedPlaylist.objects.filter(user=request.user, playlist=obj).exists()

    def get_is_owner(self, obj):
        """Check if current user owns this playlist."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.user_id == request.user.id


class PlaylistListSerializer(serializers.ModelSerializer):
    """Lightweight playlist for lists."""

    owner = UserPublicSerializer(source="user", read_only=True)
    forked_from = ForkedFromSerializer(read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            "id", "owner", "title", "description", "visibility",
            "items_count", "save_count", "fork_count", "forked_from",
            "is_saved", "is_owner", "created_at", "updated_at",
        ]

    def get_is_saved(self, obj):
        """Check if current user has saved this playlist."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return SavedPlaylist.objects.filter(user=request.user, playlist=obj).exists()

    def get_is_owner(self, obj):
        """Check if current user owns this playlist."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.user_id == request.user.id


class SavedPlaylistSerializer(serializers.ModelSerializer):
    """Serializer for saved playlists (bookmarked)."""

    playlist = PlaylistListSerializer(read_only=True)

    class Meta:
        model = SavedPlaylist
        fields = ["id", "playlist", "created_at"]


class ReorderSerializer(serializers.Serializer):
    """Serializer for reordering playlist items."""

    item_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )

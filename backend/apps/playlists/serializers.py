from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import VenueListSerializer

from .models import Playlist, PlaylistItem


class PlaylistItemSerializer(serializers.ModelSerializer):
    """Playlist item with embedded venue."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = PlaylistItem
        fields = ["id", "venue", "venue_detail", "caption", "sort_order", "created_at"]
        read_only_fields = ["id", "sort_order", "created_at"]


class PlaylistSerializer(serializers.ModelSerializer):
    """Full playlist with embedded items and owner."""

    owner = UserPublicSerializer(source="user", read_only=True)
    items = PlaylistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id", "owner", "title", "description", "is_public",
            "items_count", "items", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "items_count", "items", "created_at", "updated_at"]


class PlaylistListSerializer(serializers.ModelSerializer):
    """Lightweight playlist for lists."""

    owner = UserPublicSerializer(source="user", read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id", "owner", "title", "description", "is_public",
            "items_count", "created_at", "updated_at",
        ]


class ReorderSerializer(serializers.Serializer):
    """Serializer for reordering playlist items."""

    item_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )

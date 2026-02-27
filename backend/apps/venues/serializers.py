from rest_framework import serializers

from .models import Venue


class VenueListSerializer(serializers.ModelSerializer):
    """Lightweight venue for lists and search results."""

    class Meta:
        model = Venue
        fields = [
            "id", "name", "cuisine_type", "location_text", "rating",
            "photo_url", "tags", "latitude", "longitude", "reviews_count",
        ]


class VenueDetailSerializer(serializers.ModelSerializer):
    """Full venue detail."""

    class Meta:
        model = Venue
        fields = [
            "id", "name", "cuisine_type", "location_text", "city",
            "rating", "photo_url", "tags", "latitude", "longitude",
            "reviews_count", "google_place_id", "created_at",
        ]

from rest_framework import serializers

from apps.venues.serializers import VenueListSerializer

from .models import UserTasteProfile, VenueTrendingScore


class TrendingVenueSerializer(serializers.Serializer):
    """Venue with trending metadata."""
    venue = VenueListSerializer()
    score = serializers.FloatField()
    review_velocity = serializers.FloatField()


class UserTasteProfileSerializer(serializers.ModelSerializer):
    """User taste profile for cold-start and personalization."""

    class Meta:
        model = UserTasteProfile
        fields = [
            "preferred_cuisines",
            "dietary_restrictions",
            "price_preference",
            "spice_tolerance",
            "completed_wizard",
            "maturity_level",
        ]

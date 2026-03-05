from rest_framework import serializers

from apps.reviews.serializers import ReviewSerializer
from apps.venues.serializers import VenueListSerializer

from .models import ReviewAuthenticity, TrendingItem, VenueRecommendation


class ReviewAuthenticitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewAuthenticity
        fields = [
            "authenticity_score",
            "is_trusted",
            "flags",
            "model_version",
            "scored_at",
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    venue = VenueListSerializer(read_only=True)

    class Meta:
        model = VenueRecommendation
        fields = [
            "id",
            "venue",
            "score",
            "reason",
            "reason_type",
            "created_at",
        ]


class TrendingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendingItem
        fields = [
            "id",
            "item_type",
            "item_id",
            "item_name",
            "trend_score",
            "velocity",
            "explanation",
            "detected_at",
        ]


class MLFeedReviewSerializer(ReviewSerializer):
    """Extended review serializer with ML score."""

    ml_score = serializers.SerializerMethodField()
    is_trusted = serializers.SerializerMethodField()

    class Meta(ReviewSerializer.Meta):
        fields = ReviewSerializer.Meta.fields + ["ml_score", "is_trusted"]

    def get_ml_score(self, obj):
        scores = self.context.get("scores", {})
        return scores.get(obj.id, 0.5)

    def get_is_trusted(self, obj):
        try:
            return obj.authenticity.is_trusted
        except Exception:
            return None

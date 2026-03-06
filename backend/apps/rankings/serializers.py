from rest_framework import serializers

from apps.venues.serializers import VenueListSerializer

from .models import PairwiseComparison, PersonalRanking


class PairwiseComparisonCreateSerializer(serializers.Serializer):
    """Serializer for submitting a pairwise comparison."""

    venue_a = serializers.UUIDField()
    venue_b = serializers.UUIDField()
    winner = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, data):
        if data["venue_a"] == data["venue_b"]:
            raise serializers.ValidationError("Cannot compare a venue to itself.")
        # Enforce ordered pair
        if str(data["venue_a"]) > str(data["venue_b"]):
            data["venue_a"], data["venue_b"] = data["venue_b"], data["venue_a"]
        # Validate winner is one of the two venues or null
        winner = data.get("winner")
        if winner is not None and winner not in (data["venue_a"], data["venue_b"]):
            raise serializers.ValidationError(
                "Winner must be one of the compared venues or null (draw)."
            )
        return data


class PairwiseComparisonSerializer(serializers.ModelSerializer):
    """Read-only serializer for pairwise comparisons."""

    venue_a_detail = VenueListSerializer(source="venue_a", read_only=True)
    venue_b_detail = VenueListSerializer(source="venue_b", read_only=True)
    winner_detail = VenueListSerializer(source="winner", read_only=True)

    class Meta:
        model = PairwiseComparison
        fields = [
            "id",
            "venue_a",
            "venue_a_detail",
            "venue_b",
            "venue_b_detail",
            "winner",
            "winner_detail",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PersonalRankingSerializer(serializers.ModelSerializer):
    """Serializer for a user's personal ranking entry."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)
    display_score = serializers.SerializerMethodField()

    class Meta:
        model = PersonalRanking
        fields = [
            "id",
            "venue",
            "venue_detail",
            "elo_score",
            "display_score",
            "comparison_count",
            "confidence",
            "rank",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "elo_score",
            "display_score",
            "comparison_count",
            "confidence",
            "rank",
            "updated_at",
        ]

    def get_display_score(self, obj):
        """
        Convert Elo score to a 1-10 display scale.

        Maps the typical Elo range (1200-1800) to 1-10.
        Scores outside this range are clamped.
        """
        elo = obj.elo_score
        # Map 1200-1800 to 1-10
        score = 1.0 + (elo - 1200.0) * 9.0 / 600.0
        return round(max(1.0, min(10.0, score)), 1)


class NextComparisonSerializer(serializers.Serializer):
    """Serializer for the next comparison pair response."""

    venue_a = VenueListSerializer()
    venue_b = VenueListSerializer()

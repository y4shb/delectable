from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import VenueListSerializer

from .models import DinnerPlan, DinnerPlanMember, DinnerPlanVenue, DinnerPlanVote


class DinnerPlanVoteSerializer(serializers.ModelSerializer):
    """Serializer for individual votes."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = DinnerPlanVote
        fields = ["id", "user", "vote", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class DinnerPlanVenueSerializer(serializers.ModelSerializer):
    """Serializer for venue options in a dinner plan."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = DinnerPlanVenue
        fields = [
            "id", "venue", "venue_detail", "total_yes", "total_no", "sort_order",
        ]
        read_only_fields = ["id", "total_yes", "total_no"]


class DinnerPlanMemberSerializer(serializers.ModelSerializer):
    """Serializer for dinner plan members."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = DinnerPlanMember
        fields = ["id", "user", "role", "has_voted", "joined_at"]
        read_only_fields = ["id", "user", "joined_at"]


class DinnerPlanSerializer(serializers.ModelSerializer):
    """Full dinner plan serializer with members and venue options."""

    creator = UserPublicSerializer(read_only=True)
    members = DinnerPlanMemberSerializer(many=True, read_only=True)
    venue_options = DinnerPlanVenueSerializer(many=True, read_only=True)
    selected_venue_detail = VenueListSerializer(
        source="selected_venue", read_only=True
    )
    total_members = serializers.SerializerMethodField()
    voted_count = serializers.SerializerMethodField()
    has_user_voted = serializers.SerializerMethodField()

    class Meta:
        model = DinnerPlan
        fields = [
            "id", "creator", "title", "description", "status",
            "share_code", "selected_venue", "selected_venue_detail",
            "vote_deadline", "suggested_date", "suggested_time",
            "max_venues", "cuisine_filter",
            "members", "venue_options",
            "total_members", "voted_count", "has_user_voted",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "creator", "share_code", "selected_venue",
            "selected_venue_detail", "members", "venue_options",
            "total_members", "voted_count", "has_user_voted",
            "created_at", "updated_at",
        ]

    def get_total_members(self, obj):
        return obj.members.count()

    def get_voted_count(self, obj):
        return obj.members.filter(has_voted=True).count()

    def get_has_user_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user, has_voted=True).exists()
        return False


class DinnerPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a dinner plan."""

    class Meta:
        model = DinnerPlan
        fields = [
            "title", "description", "vote_deadline",
            "suggested_date", "suggested_time",
            "max_venues", "cuisine_filter",
        ]


class SubmitVotesSerializer(serializers.Serializer):
    """Serializer for batch vote submission."""

    venue_id = serializers.UUIDField()
    vote = serializers.ChoiceField(choices=["yes", "no", "skip"])


class BatchVotesSerializer(serializers.Serializer):
    """Wrapper serializer for batch votes."""

    votes = SubmitVotesSerializer(many=True)

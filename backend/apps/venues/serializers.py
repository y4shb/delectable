from django.db.models import Avg, Count, Q
from rest_framework import serializers

from .models import (
    DietaryReport,
    Dish,
    FoodGuide,
    GuideStop,
    KitchenStory,
    OccasionTag,
    SeasonalHighlight,
    Venue,
    VenueOccasion,
    VenueResponse,
)


class VenueListSerializer(serializers.ModelSerializer):
    """Lightweight venue for lists and search results."""

    class Meta:
        model = Venue
        fields = [
            "id", "name", "cuisine_type", "location_text", "rating",
            "photo_url", "tags", "latitude", "longitude", "reviews_count",
            "price_level",
        ]


class DishListSerializer(serializers.ModelSerializer):
    """Lightweight dish serializer for lists."""

    class Meta:
        model = Dish
        fields = ["id", "name", "category", "avg_rating", "review_count", "venue"]


class DishDetailSerializer(serializers.ModelSerializer):
    """Full dish detail with venue info and recent reviews."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = Dish
        fields = ["id", "name", "category", "avg_rating", "review_count", "venue", "venue_detail"]


class OccasionTagSerializer(serializers.ModelSerializer):
    """Occasion tag serializer."""

    class Meta:
        model = OccasionTag
        fields = ["slug", "label", "emoji", "category"]


class VenueOccasionSerializer(serializers.Serializer):
    """Venue occasion with vote info."""

    occasion = OccasionTagSerializer()
    vote_count = serializers.IntegerField()
    user_voted = serializers.SerializerMethodField()

    def get_user_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return getattr(obj, "_user_voted", False)
        return False


class DietaryBadgeSerializer(serializers.Serializer):
    """Aggregated dietary badge for a venue."""

    category = serializers.CharField()
    confidence = serializers.FloatField()
    is_available = serializers.BooleanField()


class DietaryReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating dietary reports."""

    class Meta:
        model = DietaryReport
        fields = ["category", "is_available", "scope", "dish"]


class VenueDetailSerializer(serializers.ModelSerializer):
    """Full venue detail with occasions, dietary badges, and dishes."""

    occasions = serializers.SerializerMethodField()
    dietary_badges = serializers.SerializerMethodField()
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = [
            "id", "name", "cuisine_type", "location_text", "city",
            "rating", "photo_url", "tags", "latitude", "longitude",
            "reviews_count", "google_place_id", "created_at",
            "price_level", "occasions", "dietary_badges", "dishes",
        ]

    def get_occasions(self, obj):
        qs = VenueOccasion.objects.filter(venue=obj).select_related("occasion").order_by("-vote_count")[:8]
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from .models import OccasionVote
            voted_slugs = set(
                OccasionVote.objects.filter(user=request.user, venue=obj)
                .values_list("occasion_id", flat=True)
            )
            for vo in qs:
                vo._user_voted = vo.occasion_id in voted_slugs
        else:
            for vo in qs:
                vo._user_voted = False
        return VenueOccasionSerializer(qs, many=True, context=self.context).data

    def get_dietary_badges(self, obj):
        reports = DietaryReport.objects.filter(venue=obj).values("category", "is_available").annotate(
            count=Count("id"),
        )
        total_reports = DietaryReport.objects.filter(venue=obj).values("category").annotate(
            total=Count("id"),
        )
        totals = {r["category"]: r["total"] for r in total_reports}

        badges = []
        for report in reports:
            cat = report["category"]
            total = totals.get(cat, 1)
            confidence = report["count"] / total if total > 0 else 0
            if confidence >= 0.5:
                badges.append({
                    "category": cat,
                    "confidence": confidence,
                    "is_available": report["is_available"],
                })
        return DietaryBadgeSerializer(badges, many=True).data

    def get_dishes(self, obj):
        qs = Dish.objects.filter(venue=obj).order_by("-review_count")[:10]
        return DishListSerializer(qs, many=True).data


class SeasonalHighlightSerializer(serializers.ModelSerializer):
    """Seasonal dish highlight with venue detail."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = SeasonalHighlight
        fields = [
            "id",
            "venue",
            "venue_detail",
            "dish_name",
            "season",
            "description",
            "photo_url",
            "is_active",
            "start_date",
            "end_date",
            "created_at",
        ]


class VenueResponseSerializer(serializers.ModelSerializer):
    """Read serializer for venue owner responses."""

    responder_name = serializers.CharField(source="responder.name", read_only=True)

    class Meta:
        model = VenueResponse
        fields = ["id", "responder_name", "text", "created_at"]
        read_only_fields = ["id", "responder_name", "created_at"]


class VenueResponseCreateSerializer(serializers.ModelSerializer):
    """Write serializer for creating venue owner responses."""

    class Meta:
        model = VenueResponse
        fields = ["text"]

    def validate_text(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Response must be at least 10 characters.")
        return value


class KitchenStoryListSerializer(serializers.ModelSerializer):
    """Lightweight kitchen story for lists."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = KitchenStory
        fields = [
            "id", "venue", "venue_detail", "title", "story_type",
            "cover_photo_url", "chef_name", "view_count", "like_count",
            "created_at",
        ]


class KitchenStoryDetailSerializer(serializers.ModelSerializer):
    """Full kitchen story detail."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = KitchenStory
        fields = [
            "id", "venue", "venue_detail", "title", "story_type",
            "content", "cover_photo_url", "chef_name", "chef_title",
            "chef_photo_url", "view_count", "like_count", "created_at",
        ]


class GuideStopSerializer(serializers.ModelSerializer):
    """Serializer for a food guide stop."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = GuideStop
        fields = [
            "id", "venue", "venue_detail", "sort_order", "description",
            "recommended_dishes", "estimated_time_minutes",
        ]


class FoodGuideListSerializer(serializers.ModelSerializer):
    """Lightweight food guide for lists."""

    stops_count = serializers.IntegerField(source="stops.count", read_only=True)
    author_name = serializers.CharField(source="author.name", read_only=True)

    class Meta:
        model = FoodGuide
        fields = [
            "id", "title", "description", "city", "neighborhood",
            "cover_photo_url", "duration_hours", "view_count",
            "save_count", "stops_count", "author_name", "created_at",
        ]


class FoodGuideDetailSerializer(serializers.ModelSerializer):
    """Full food guide detail with stops."""

    stops = GuideStopSerializer(many=True, read_only=True)
    author_name = serializers.CharField(source="author.name", read_only=True)
    author_avatar = serializers.URLField(source="author.avatar_url", read_only=True)

    class Meta:
        model = FoodGuide
        fields = [
            "id", "title", "description", "city", "neighborhood",
            "cover_photo_url", "duration_hours", "is_published",
            "view_count", "save_count", "stops", "author_name",
            "author_avatar", "created_at",
        ]

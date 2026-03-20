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
    VenueRatingSnapshot,
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
        # Use prefetched occasions if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'occasions' in obj._prefetched_objects_cache:
            qs = list(obj.occasions.all())[:8]
        else:
            qs = list(VenueOccasion.objects.filter(venue=obj).select_related("occasion").order_by("-vote_count")[:8])
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
        # Use prefetched dietary_reports if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'dietary_reports' in obj._prefetched_objects_cache:
            all_reports = list(obj.dietary_reports.all())
            # Aggregate in Python from prefetched data
            from collections import defaultdict
            cat_counts = defaultdict(lambda: {"available": 0, "total": 0})
            for report in all_reports:
                cat_counts[report.category]["total"] += 1
                if report.is_available:
                    cat_counts[report.category]["available"] += 1
            reports = [
                {"category": cat, "available_count": v["available"], "total_count": v["total"]}
                for cat, v in cat_counts.items()
            ]
        else:
            reports = DietaryReport.objects.filter(venue=obj).values("category").annotate(
                available_count=Count("id", filter=Q(is_available=True)),
                total_count=Count("id"),
            )

        badges = []
        for report in reports:
            cat = report["category"]
            total = report["total_count"]
            available = report["available_count"]
            confidence = available / total if total > 0 else 0
            if confidence >= 0.5:
                badges.append({
                    "category": cat,
                    "confidence": confidence,
                    "is_available": True,
                })
            else:
                unavailable_confidence = (total - available) / total if total > 0 else 0
                if unavailable_confidence >= 0.5:
                    badges.append({
                        "category": cat,
                        "confidence": unavailable_confidence,
                        "is_available": False,
                    })
        return DietaryBadgeSerializer(badges, many=True).data

    def get_dishes(self, obj):
        # Use prefetched dishes if available, otherwise query
        if hasattr(obj, '_prefetched_dishes'):
            return DishListSerializer(obj._prefetched_dishes, many=True).data
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

    stops_count = serializers.IntegerField(read_only=True)
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


# ---------------------------------------------------------------------------
# Timeline / Dish Comparison Serializers
# ---------------------------------------------------------------------------


class RatingSnapshotSerializer(serializers.Serializer):
    """A single period snapshot in a timeline."""

    periodStart = serializers.DateField(source="period_start")
    avgRating = serializers.DecimalField(
        source="avg_rating", max_digits=4, decimal_places=2
    )
    reviewCount = serializers.IntegerField(source="review_count")
    minRating = serializers.DecimalField(
        source="min_rating", max_digits=4, decimal_places=1, allow_null=True
    )
    maxRating = serializers.DecimalField(
        source="max_rating", max_digits=4, decimal_places=1, allow_null=True
    )


class VenueTimelineSerializer(serializers.Serializer):
    """Response for venue and dish timeline endpoints."""

    venue = serializers.SerializerMethodField()
    trend = serializers.CharField()
    trendScore = serializers.FloatField(source="trend_score")
    snapshots = RatingSnapshotSerializer(many=True)
    totalReviews = serializers.IntegerField(source="total_reviews")
    firstReviewDate = serializers.DateTimeField(
        source="first_review_date", allow_null=True
    )

    def get_venue(self, obj):
        v = obj["venue_obj"]
        return {
            "id": str(v.id),
            "name": v.name,
            "currentRating": float(v.rating),
        }


class UserVisitSerializer(serializers.Serializer):
    """A single user visit/review at a venue."""

    reviewId = serializers.UUIDField(source="id")
    rating = serializers.DecimalField(max_digits=4, decimal_places=1)
    text = serializers.CharField(allow_blank=True)
    dishName = serializers.CharField(source="dish_name", allow_blank=True)
    photoUrl = serializers.URLField(
        source="photo_url", allow_blank=True, required=False
    )
    tags = serializers.ListField(child=serializers.CharField())
    createdAt = serializers.DateTimeField(source="created_at")


class VenueUserTimelineSerializer(serializers.Serializer):
    """Response for a user's personal timeline at a venue."""

    venue = serializers.SerializerMethodField()
    visits = UserVisitSerializer(many=True)
    visitCount = serializers.IntegerField(source="visit_count")
    avgRating = serializers.DecimalField(
        source="avg_rating", max_digits=4, decimal_places=2, allow_null=True
    )
    ratingTrend = serializers.CharField(source="rating_trend")

    def get_venue(self, obj):
        v = obj["venue_obj"]
        return {"id": str(v.id), "name": v.name}


class DishComparisonSideSerializer(serializers.Serializer):
    """One side of a dish comparison."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    venueName = serializers.CharField(source="venue_name")
    avgRating = serializers.DecimalField(
        source="avg_rating", max_digits=4, decimal_places=1
    )
    reviewCount = serializers.IntegerField(source="review_count")
    topTags = serializers.ListField(
        child=serializers.CharField(), source="top_tags"
    )
    recentTrend = serializers.CharField(source="recent_trend")
    ratingHistory = RatingSnapshotSerializer(
        many=True, source="rating_history"
    )


class DishComparisonResultSerializer(serializers.Serializer):
    """Comparison summary between two dishes."""

    ratingDifference = serializers.FloatField(source="rating_difference")
    popularityDifference = serializers.IntegerField(
        source="popularity_difference"
    )
    winner = serializers.CharField()


class DishCompareSerializer(serializers.Serializer):
    """Response for the dish comparison endpoint."""

    dishA = DishComparisonSideSerializer(source="dish_a")
    dishB = DishComparisonSideSerializer(source="dish_b")
    comparison = DishComparisonResultSerializer()

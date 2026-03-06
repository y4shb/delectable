"""ML API views for recommendations, authenticity, and trending."""

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from apps.venues.serializers import VenueListSerializer

from .models import ReviewAuthenticity, TrendingItem, VenueRecommendation
from .serializers import (
    MLFeedReviewSerializer,
    RecommendationSerializer,
    ReviewAuthenticitySerializer,
    TrendingItemSerializer,
)
from .services import (
    detect_trending_items,
    generate_recommendations,
    score_feed_for_user,
    score_review_authenticity,
)


class MLBurstThrottle(UserRateThrottle):
    rate = '10/minute'


class RecommendationsView(APIView):
    """GET /api/ml/recommendations/ — Personalized venue recommendations."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MLBurstThrottle]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        refresh = request.query_params.get("refresh", "false").lower() == "true"

        if refresh:
            # Generate fresh recommendations
            recommendations = generate_recommendations(request.user, limit)
            venues = [r["venue"] for r in recommendations]
            reasons = {str(r["venue"].id): r["reason"] for r in recommendations}
        else:
            # Use cached recommendations
            cached = VenueRecommendation.objects.filter(
                user=request.user
            ).select_related("venue").order_by("-score")[:limit]

            if not cached.exists():
                # Generate if no cache
                recommendations = generate_recommendations(request.user, limit)
                venues = [r["venue"] for r in recommendations]
                reasons = {str(r["venue"].id): r["reason"] for r in recommendations}
            else:
                venues = [r.venue for r in cached]
                reasons = {str(r.venue_id): r.reason for r in cached}

        serializer = VenueListSerializer(venues, many=True)

        # Add reasons to response
        data = serializer.data
        for item in data:
            item["recommendation_reason"] = reasons.get(item["id"], "")

        return Response({"data": data})


class MLScoredFeedView(APIView):
    """GET /api/ml/feed/ — ML-scored feed for user."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MLBurstThrottle]

    def get(self, request):
        from apps.reviews.models import Review

        limit = int(request.query_params.get("limit", 20))

        # Get recent reviews
        reviews = Review.objects.select_related(
            "user", "venue"
        ).order_by("-created_at")[:100]

        # Score with ML
        scored = score_feed_for_user(reviews, request.user)[:limit]

        serializer = MLFeedReviewSerializer(
            [s["review"] for s in scored],
            many=True,
            context={"request": request, "scores": {s["review"].id: s["ml_score"] for s in scored}},
        )

        return Response({"data": serializer.data})


class ReviewAuthenticityView(APIView):
    """GET /api/reviews/{id}/authenticity/ — Get authenticity score for a review."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        from apps.reviews.models import Review

        try:
            review = Review.objects.get(id=id)
        except Review.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            auth = ReviewAuthenticity.objects.get(review=review)
        except ReviewAuthenticity.DoesNotExist:
            # Score on demand
            score = score_review_authenticity(review)
            auth = ReviewAuthenticity.objects.get(review=review)

        serializer = ReviewAuthenticitySerializer(auth)
        return Response(serializer.data)


class TrustedBadgeView(APIView):
    """GET /api/reviews/{id}/trusted-badge/ — Check if review has trusted badge."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        try:
            auth = ReviewAuthenticity.objects.get(review_id=id)
            return Response({
                "is_trusted": auth.is_trusted,
                "score": auth.authenticity_score,
            })
        except ReviewAuthenticity.DoesNotExist:
            return Response({
                "is_trusted": None,
                "score": None,
            })


class TrendingView(generics.ListAPIView):
    """GET /api/ml/trending/ — Trending venues and dishes."""

    serializer_class = TrendingItemSerializer
    # SECURITY: Require authentication to protect competitive intelligence data
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        item_type = self.request.query_params.get("type", "venue")
        region = self.request.query_params.get("region", "")

        # Refresh trending if stale
        recent = TrendingItem.objects.filter(
            detected_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).exists()

        if not recent:
            detect_trending_items(region)

        qs = TrendingItem.objects.filter(expires_at__gt=timezone.now())
        if item_type:
            qs = qs.filter(item_type=item_type)
        if region:
            qs = qs.filter(region=region)

        return qs.order_by("-trend_score")[:20]


class RefreshTrendingView(APIView):
    """POST /api/ml/trending/refresh/ — Force refresh trending items."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        region = request.data.get("region", "")
        items = detect_trending_items(region)
        return Response({
            "refreshed": len(items),
            "region": region,
        })


class IngestVenuesView(APIView):
    """POST /api/ml/ingest/ — Trigger venue ingestion from external sources."""

    permission_classes = [permissions.IsAdminUser]
    throttle_classes = [MLBurstThrottle]

    def post(self, request):
        from .ingestion import run_ingestion_pipeline

        lat = request.data.get("lat")
        lng = request.data.get("lng")
        radius = int(request.data.get("radius", 5000))

        if not lat or not lng:
            return Response(
                {"error": "lat and lng required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coordinate ranges
        lat = float(lat)
        lng = float(lng)
        if not (-90 <= lat <= 90):
            return Response(
                {"error": "lat must be between -90 and 90"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (-180 <= lng <= 180):
            return Response(
                {"error": "lng must be between -180 and 180"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (100 <= radius <= 50000):
            return Response(
                {"error": "radius must be between 100 and 50000"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = run_ingestion_pipeline(
            latitude=lat,
            longitude=lng,
            radius=radius,
        )

        return Response(results)


class DataQualityView(APIView):
    """GET /api/ml/data-quality/ — Check data ingestion quality."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from .ingestion import validate_ingested_data
        results = validate_ingested_data()
        return Response(results)

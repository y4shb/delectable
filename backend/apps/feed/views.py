from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import FeedCursorPagination
from apps.core.permissions import ReadPublicWriteAuthenticated
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer
from apps.users.models import Follow
from apps.venues.serializers import VenueListSerializer

from .engine import (
    anonymous_feed,
    augmented_feed,
    cold_start_feed,
    compute_feed_score,
    explore_feed,
    get_engagement_percentiles,
    get_trending_venues,
    get_user_tier,
    mmr_rerank,
)
from .models import UserTasteProfile, VenueTrendingScore
from .serializers import TrendingVenueSerializer, UserTasteProfileSerializer


class FeedView(generics.ListAPIView):
    """
    GET /api/feed/ — Main feed endpoint with intelligent ranking.

    Supports anonymous access (content-first onboarding).

    Query params:
        tab: "recent" | "top-picks" | "explore" (default: "top-picks")
        cursor: pagination cursor
        limit: page size (default 20, max 50)
    """

    serializer_class = ReviewSerializer
    permission_classes = [ReadPublicWriteAuthenticated]

    def get_queryset(self):
        # This won't be used for scored feeds; overridden in list()
        return Review.objects.none()

    def list(self, request, *args, **kwargs):
        user = request.user
        tab = request.query_params.get("tab", "top-picks")

        # Anonymous users (tier 0) get trending/popular feed
        if not user.is_authenticated:
            reviews = anonymous_feed(limit=20)
            serializer = self.get_serializer(reviews, many=True)
            return Response({"results": serializer.data})

        tier = get_user_tier(user)

        # Cold-start users (tier 1)
        if tier == 1 and tab != "explore":
            reviews = cold_start_feed(user, limit=20)
            serializer = self.get_serializer(reviews, many=True)
            return Response({"results": serializer.data})

        # Augmented users (tier 2)
        if tier == 2 and tab != "explore":
            reviews = augmented_feed(user, limit=20)
            serializer = self.get_serializer(reviews, many=True)
            return Response({"results": serializer.data})

        if tab == "recent":
            # Chronological from followed users
            following_ids = Follow.objects.filter(
                follower=user
            ).values_list("following_id", flat=True)
            reviews = list(
                Review.objects.filter(user_id__in=following_ids)
                .select_related("user", "venue")
                .order_by("-created_at")[:20]
            )
            serializer = self.get_serializer(reviews, many=True)
            return Response({"results": serializer.data})

        elif tab == "top-picks":
            # EdgeRank-scored feed from followed users
            following_ids = set(
                Follow.objects.filter(follower=user).values_list("following_id", flat=True)
            )
            # Include own reviews too
            following_ids.add(user.id)
            candidates = list(
                Review.objects.filter(user_id__in=following_ids)
                .select_related("user", "venue")
                .order_by("-created_at")[:100]
            )

            if not candidates:
                # Fallback: global popular
                candidates = list(
                    Review.objects.select_related("user", "venue")
                    .order_by("-like_count", "-created_at")[:20]
                )
                serializer = self.get_serializer(candidates, many=True)
                return Response({"results": serializer.data})

            engagement_pcts = get_engagement_percentiles()
            scored = []
            for review in candidates:
                score = compute_feed_score(review, user, engagement_pcts)
                scored.append((review, score))

            scored.sort(key=lambda x: x[1], reverse=True)
            ranked = [r for r, _ in scored[:60]]

            # Apply MMR diversity
            diversified = mmr_rerank(ranked, limit=20)
            serializer = self.get_serializer(diversified, many=True)
            return Response({"results": serializer.data})

        elif tab == "explore":
            reviews = explore_feed(user, limit=20)
            serializer = self.get_serializer(reviews, many=True)
            return Response({"results": serializer.data})

        # Default fallback
        reviews = list(
            Review.objects.select_related("user", "venue")
            .order_by("-created_at")[:20]
        )
        serializer = self.get_serializer(reviews, many=True)
        return Response({"results": serializer.data})


class TrendingView(APIView):
    """GET /api/feed/trending/ — Trending venues."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        trending = get_trending_venues(limit=10)
        data = []
        for ts in trending:
            venue_data = VenueListSerializer(ts.venue).data
            venue_data["trending_score"] = round(ts.score, 2)
            venue_data["review_velocity"] = round(ts.review_velocity, 2)
            data.append(venue_data)
        return Response({"results": data})


class TasteProfileView(APIView):
    """GET/PUT /api/feed/taste-profile/ — User's taste preferences."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserTasteProfile.objects.get_or_create(user=request.user)
        serializer = UserTasteProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserTasteProfile.objects.get_or_create(user=request.user)
        serializer = UserTasteProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FeedTierView(APIView):
    """GET /api/feed/tier/ — Returns user's current feed tier."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tier = get_user_tier(request.user)
        tier_names = {0: "anonymous", 1: "cold_start", 2: "augmented", 3: "healthy"}
        return Response({
            "tier": tier,
            "tier_name": tier_names.get(tier, "unknown"),
        })

import math
from decimal import Decimal

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import FeedCursorPagination
from apps.core.permissions import ReadPublicWriteAuthenticated
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer
from apps.users.models import Follow
from apps.venues.models import DietaryReport, OccasionTag, Venue, VenueOccasion
from apps.venues.serializers import VenueListSerializer

from .engine import (
    _precompute_viewer_preference_data,
    anonymous_feed,
    augmented_feed,
    batch_precompute_social_scores,
    cold_start_feed,
    compute_feed_score,
    explore_feed,
    get_engagement_percentiles,
    get_engagement_score,
    get_preference_score,
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
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        # This won't be used for scored feeds; overridden in list()
        return Review.objects.none()

    def _paginated_response(self, reviews, request):
        """Return a paginated response with cursor-based pagination metadata."""
        limit = min(int(request.query_params.get("limit", 20)), 50)
        cursor = request.query_params.get("cursor")

        # Simple offset-based cursor for scored feeds (cursor = offset number)
        offset = 0
        if cursor:
            try:
                offset = int(cursor)
            except (ValueError, TypeError):
                offset = 0

        page = reviews[offset:offset + limit]
        has_more = len(reviews) > offset + limit
        next_cursor = str(offset + limit) if has_more else None

        serializer = self.get_serializer(page, many=True)
        return Response({
            "data": serializer.data,
            "pagination": {
                "next_cursor": next_cursor,
                "has_more": has_more,
                "limit": limit,
            },
        })

    def list(self, request, *args, **kwargs):
        user = request.user
        tab = request.query_params.get("tab", "top-picks")

        # Anonymous users (tier 0) get trending/popular feed
        if not user.is_authenticated:
            reviews = anonymous_feed(limit=20)
            return self._paginated_response(reviews, request)

        tier = get_user_tier(user)

        # Cold-start users (tier 1)
        if tier == 1 and tab != "explore":
            reviews = cold_start_feed(user, limit=20)
            return self._paginated_response(reviews, request)

        # Augmented users (tier 2)
        if tier == 2 and tab != "explore":
            reviews = augmented_feed(user, limit=20)
            return self._paginated_response(reviews, request)

        if tab == "recent":
            # Chronological from followed users - use subquery for large IN clause
            following_subquery = Follow.objects.filter(
                follower=user
            ).values("following_id")
            reviews = list(
                Review.objects.filter(user_id__in=following_subquery)
                .select_related("user", "venue")
                .order_by("-created_at")[:100]
            )
            return self._paginated_response(reviews, request)

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
                .annotate(bookmark_count=Count("bookmarks"))
                .order_by("-created_at")[:100]
            )

            if not candidates:
                # Fallback: global popular
                candidates = list(
                    Review.objects.select_related("user", "venue")
                    .order_by("-like_count", "-created_at")[:20]
                )
                return self._paginated_response(candidates, request)

            # Batch-precompute social scores and viewer preference data (fixes N+1)
            authors = list({r.user for r in candidates})
            social_scores = batch_precompute_social_scores(user, authors)
            viewer_tags, viewer_avg_rating = _precompute_viewer_preference_data(user)
            engagement_pcts = get_engagement_percentiles()
            now = timezone.now()

            scored = []
            for review in candidates:
                social = social_scores.get(review.user_id, 0.0)
                engagement = get_engagement_score(
                    review,
                    percentile_95_likes=engagement_pcts.get("likes", 10),
                    percentile_95_comments=engagement_pcts.get("comments", 5),
                )
                preference = get_preference_score(
                    user, review,
                    viewer_tags=viewer_tags,
                    viewer_avg_rating=viewer_avg_rating,
                )
                quality = review.quality_score

                raw_score = (
                    0.30 * social
                    + 0.25 * engagement
                    + 0.25 * preference
                    + 0.20 * quality
                )

                age_hours = (now - review.created_at).total_seconds() / 3600
                decay = (age_hours + 2) ** 1.5
                final_score = raw_score / decay

                scored.append((review, final_score))

            scored.sort(key=lambda x: x[1], reverse=True)
            ranked = [r for r, _ in scored[:60]]

            # Apply MMR diversity
            diversified = mmr_rerank(ranked, limit=20)
            return self._paginated_response(diversified, request)

        elif tab == "explore":
            reviews = explore_feed(user, limit=20)
            return self._paginated_response(reviews, request)

        # Default fallback
        reviews = list(
            Review.objects.select_related("user", "venue")
            .order_by("-created_at")[:20]
        )
        return self._paginated_response(reviews, request)


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
        return Response({"data": data})


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


# ---------------------------------------------------------------------------
# Decision Engine — "What Should I Eat?" discovery wizard
# ---------------------------------------------------------------------------

DISTANCE_RADIUS_KM = {
    "walking": 1,
    "short_drive": 5,
    "worth_the_trip": 15,
}


def _haversine_km(lat1, lon1, lat2, lon2):
    """Compute great-circle distance between two points in km."""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = (
        math.radians(float(v)) for v in (lat1, lon1, lat2, lon2)
    )
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


class DecisionEngineSerializer(drf_serializers.Serializer):
    """Validates the POST body for the decision engine endpoint."""

    occasion = drf_serializers.CharField(required=True, help_text="Occasion slug")
    distance = drf_serializers.ChoiceField(
        choices=["walking", "short_drive", "worth_the_trip"],
        required=False,
        default=None,
    )
    dietary = drf_serializers.ListField(
        child=drf_serializers.CharField(), required=False, default=list
    )
    cuisine_preference = drf_serializers.CharField(required=False, default=None, allow_blank=True)
    lat = drf_serializers.FloatField(required=False, default=None)
    lng = drf_serializers.FloatField(required=False, default=None)


class DecisionEngineView(APIView):
    """
    POST /api/feed/discover/ — Decision engine for restaurant discovery.

    Accepts occasion, distance, dietary filters and returns top venue picks
    with personalized scoring and explanations.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DecisionEngineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data

        occasion_slug = params["occasion"]
        distance_key = params.get("distance")
        dietary_filters = params.get("dietary") or []
        cuisine_preference = params.get("cuisine_preference")
        user_lat = params.get("lat")
        user_lng = params.get("lng")

        # Step 1: Filter venues by occasion tags (join VenueOccasion)
        venue_ids_by_occasion = set(
            VenueOccasion.objects.filter(occasion_id=occasion_slug)
            .values_list("venue_id", flat=True)
        )

        if not venue_ids_by_occasion:
            # Fallback: if no venues match the occasion, use all venues
            venues_qs = Venue.objects.all()
        else:
            venues_qs = Venue.objects.filter(id__in=venue_ids_by_occasion)

        # Step 2: Filter by dietary availability
        if dietary_filters:
            dietary_venue_ids = set(
                DietaryReport.objects.filter(
                    category__in=dietary_filters, is_available=True
                )
                .values_list("venue_id", flat=True)
            )
            if dietary_venue_ids:
                venues_qs = venues_qs.filter(id__in=dietary_venue_ids)

        # Step 3: Filter by distance radius from user location
        candidates = list(venues_qs[:200])  # Cap candidates

        if distance_key and user_lat is not None and user_lng is not None:
            max_km = DISTANCE_RADIUS_KM.get(distance_key, 15)
            filtered = []
            for venue in candidates:
                if venue.latitude is not None and venue.longitude is not None:
                    dist = _haversine_km(user_lat, user_lng, venue.latitude, venue.longitude)
                    venue._distance_km = dist
                    if dist <= max_km:
                        filtered.append(venue)
                else:
                    # Venues without coordinates: include with unknown distance
                    venue._distance_km = None
                    filtered.append(venue)
            candidates = filtered
        else:
            for venue in candidates:
                venue._distance_km = None

        # Step 4: Score remaining venues
        user = request.user if request.user.is_authenticated else None
        taste_profile = None
        if user:
            taste_profile = UserTasteProfile.objects.filter(user=user).first()

        # Get occasion vote counts for scoring
        occasion_votes = {}
        if venue_ids_by_occasion:
            for vo in VenueOccasion.objects.filter(
                occasion_id=occasion_slug, venue_id__in=[v.id for v in candidates]
            ):
                occasion_votes[vo.venue_id] = vo.vote_count

        # Get trending scores for boost
        trending_map = {
            ts.venue_id: ts.score
            for ts in VenueTrendingScore.objects.filter(
                venue_id__in=[v.id for v in candidates], score__gt=0
            )
        }

        # Pre-compute social data to avoid N+1 queries inside the loop
        following_ids = set()
        friend_review_counts = {}
        if user:
            following_ids = set(
                Follow.objects.filter(follower=user).values_list("following_id", flat=True)
            )
            if following_ids:
                candidate_ids = [v.id for v in candidates]
                friend_venue_counts = (
                    Review.objects.filter(
                        venue_id__in=candidate_ids, user_id__in=following_ids
                    )
                    .values("venue_id")
                    .annotate(cnt=Count("id"))
                )
                friend_review_counts = {
                    row["venue_id"]: row["cnt"] for row in friend_venue_counts
                }

        scored_venues = []
        for venue in candidates:
            score = 0.0
            match_reasons = []

            # Rating component (0-0.30)
            rating_val = float(venue.rating) if venue.rating else 0
            rating_score = min(rating_val / 10, 1.0) * 0.30
            score += rating_score
            if rating_val >= 8.0:
                match_reasons.append("Highly rated")

            # Occasion relevance (0-0.25)
            vote_count = occasion_votes.get(venue.id, 0)
            occasion_score = min(vote_count / 10, 1.0) * 0.25
            score += occasion_score
            if vote_count >= 3:
                match_reasons.append("Popular for this occasion")

            # Cuisine preference match (0-0.20)
            if cuisine_preference and venue.cuisine_type:
                if cuisine_preference.lower() in venue.cuisine_type.lower():
                    score += 0.20
                    match_reasons.append(f"Matches your {cuisine_preference} craving")
            elif user and taste_profile and taste_profile.preferred_cuisines:
                fav = {c.lower() for c in taste_profile.preferred_cuisines}
                if venue.cuisine_type and venue.cuisine_type.lower() in fav:
                    score += 0.15
                    match_reasons.append("Matches your taste profile")
            elif user and hasattr(user, "favorite_cuisines") and user.favorite_cuisines:
                fav = {c.lower() for c in user.favorite_cuisines}
                if venue.cuisine_type and venue.cuisine_type.lower() in fav:
                    score += 0.15
                    match_reasons.append("One of your favorite cuisines")

            # Trending boost (0-0.10)
            trending_val = trending_map.get(venue.id, 0)
            if trending_val > 0:
                trending_boost = min(trending_val / 10, 1.0) * 0.10
                score += trending_boost
                match_reasons.append("Trending right now")

            # Social signal — reviews from friends (0-0.10)
            if user and following_ids:
                friend_count = friend_review_counts.get(venue.id, 0)
                if friend_count > 0:
                    social_boost = min(friend_count / 5, 1.0) * 0.10
                    score += social_boost
                    match_reasons.append("Loved by friends you follow")

            # Review count component (0-0.05)
            reviews_count = venue.reviews_count or 0
            if reviews_count >= 10:
                score += 0.05
                match_reasons.append(f"{reviews_count} reviews")
            elif reviews_count >= 5:
                score += 0.03

            # Proximity bonus for closer venues
            if venue._distance_km is not None and venue._distance_km < 1:
                match_reasons.append("Very close to you")

            # Generate explanation text
            explanation = _build_explanation(
                venue, occasion_slug, match_reasons, venue._distance_km
            )

            scored_venues.append({
                "venue": venue,
                "score": round(score, 4),
                "explanation": explanation,
                "match_reasons": match_reasons[:5],
                "distance_km": round(venue._distance_km, 2) if venue._distance_km is not None else None,
            })

        # Sort by score descending
        scored_venues.sort(key=lambda x: x["score"], reverse=True)
        top_picks = scored_venues[:5]

        # Serialize response
        picks = []
        for item in top_picks:
            venue_data = VenueListSerializer(item["venue"]).data
            picks.append({
                "venue": venue_data,
                "score": round(item["score"] * 100, 1),  # Convert to percentage
                "explanation": item["explanation"],
                "match_reasons": item["match_reasons"],
                "distance_km": item["distance_km"],
            })

        return Response({"picks": picks})


def _build_explanation(venue, occasion_slug, match_reasons, distance_km):
    """Build a personalized explanation string for a venue pick."""
    parts = []
    name = venue.name

    if "Highly rated" in match_reasons:
        parts.append(f"{name} has excellent ratings")
    elif venue.rating and float(venue.rating) >= 7:
        parts.append(f"{name} is well-reviewed")
    else:
        parts.append(f"{name} could be a great find")

    if "Popular for this occasion" in match_reasons:
        parts.append("and is a popular choice for this occasion")

    if "Trending right now" in match_reasons:
        parts.append("and is trending right now")

    if distance_km is not None:
        if distance_km < 0.5:
            parts.append("- just a short walk away")
        elif distance_km < 2:
            parts.append(f"- about {int(distance_km * 15)} min walk")
        elif distance_km < 10:
            parts.append(f"- a {int(distance_km * 2)} min drive")

    explanation = " ".join(parts) + "."
    return explanation


class WeatherRecommendationsView(APIView):
    """GET /api/feed/weather-recs/ — Weather-aware venue recommendations."""

    permission_classes = [permissions.AllowAny]

    WEATHER_TAG_MAP = {
        "rain": ["ramen", "comfort-food", "soup", "stew", "hot-pot"],
        "cold": ["ramen", "comfort-food", "soup", "stew", "hot-pot"],
        "hot": ["salad", "ice-cream", "cold-noodles", "sushi", "smoothie"],
        "nice": ["outdoor-dining", "brunch", "patio"],
    }

    WEATHER_CUISINE_MAP = {
        "rain": ["Japanese", "Korean", "Vietnamese"],
        "cold": ["Japanese", "Korean", "Indian"],
        "hot": ["Japanese", "Mexican", "Mediterranean"],
        "nice": ["Italian", "American", "French"],
    }

    def get(self, request):
        condition = request.query_params.get("condition", "nice")
        if condition not in self.WEATHER_TAG_MAP:
            condition = "nice"

        matching_tags = self.WEATHER_TAG_MAP[condition]
        matching_cuisines = self.WEATHER_CUISINE_MAP[condition]

        # Find venues matching tags or cuisine
        tag_filter = Q()
        for tag in matching_tags:
            tag_filter |= Q(tags__icontains=tag)

        cuisine_filter = Q(cuisine_type__in=matching_cuisines)

        venues = (
            Venue.objects.filter(tag_filter | cuisine_filter)
            .distinct()
            .order_by("-rating")[:5]
        )

        serializer = VenueListSerializer(venues, many=True)
        return Response({
            "condition": condition,
            "message": self._get_message(condition),
            "data": serializer.data,
        })

    @staticmethod
    def _get_message(condition):
        messages = {
            "rain": "Rainy day comfort food picks",
            "cold": "Warm up with these cozy spots",
            "hot": "Beat the heat with these refreshing picks",
            "nice": "Perfect weather for these spots",
        }
        return messages.get(condition, "Top picks for today")

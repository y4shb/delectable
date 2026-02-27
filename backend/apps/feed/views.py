from rest_framework import generics, permissions
from rest_framework.response import Response

from apps.core.pagination import FeedCursorPagination
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer
from apps.users.models import Follow


class FeedView(generics.ListAPIView):
    """
    GET /api/feed/ — Main feed endpoint.

    Query params:
        tab: "recent" | "top-picks" | "explore" (default: "recent")
        cursor: pagination cursor
        limit: page size (default 20, max 50)
    """

    serializer_class = ReviewSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        user = self.request.user
        tab = self.request.query_params.get("tab", "recent")

        base_qs = Review.objects.select_related("user", "venue")

        if tab == "recent":
            # Reviews from followed users, chronological
            following_ids = Follow.objects.filter(
                follower=user
            ).values_list("following_id", flat=True)
            return base_qs.filter(user_id__in=following_ids).order_by("-created_at")

        elif tab == "top-picks":
            # Reviews from followed users, sorted by engagement
            following_ids = Follow.objects.filter(
                follower=user
            ).values_list("following_id", flat=True)
            return base_qs.filter(
                user_id__in=following_ids
            ).order_by("-like_count", "-created_at")

        elif tab == "explore":
            # Trending reviews from outside user's network
            following_ids = Follow.objects.filter(
                follower=user
            ).values_list("following_id", flat=True)
            return base_qs.exclude(
                user_id__in=following_ids
            ).exclude(
                user=user
            ).order_by("-like_count", "-created_at")

        # Default: all recent reviews
        return base_qs.order_by("-created_at")

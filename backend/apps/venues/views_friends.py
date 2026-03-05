from collections import defaultdict

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review
from apps.users.models import Follow

from .serializers import VenueListSerializer


class FriendsVenuesView(APIView):
    """GET /api/venues/friends/ — Venues reviewed by followed users with friend avatar data."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        following_ids = Follow.objects.filter(
            follower=request.user
        ).values_list("following_id", flat=True)

        friend_reviews = (
            Review.objects.filter(user_id__in=following_ids)
            .select_related("venue", "user")
            .order_by("-created_at")
        )

        # Group by venue with friend data
        venue_friends = defaultdict(list)
        venue_map = {}
        for review in friend_reviews:
            vid = review.venue_id
            if vid not in venue_map:
                venue_map[vid] = review.venue
            if not any(f["id"] == str(review.user_id) for f in venue_friends[vid]):
                venue_friends[vid].append({
                    "id": str(review.user_id),
                    "name": review.user.name,
                    "avatar_url": review.user.avatar_url,
                })

        results = []
        for vid, venue in venue_map.items():
            data = VenueListSerializer(venue).data
            data["friend_avatars"] = venue_friends[vid][:5]
            results.append(data)

        return Response({"results": results})

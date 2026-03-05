from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.db import json_array_contains
from apps.users.models import User
from apps.users.serializers import UserPublicSerializer
from apps.venues.models import Venue
from apps.venues.serializers import VenueListSerializer
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer


class SearchView(APIView):
    """
    GET /api/search/?q=...&type=all|venue|user|review

    Unified search across venues, users, and reviews.
    Uses case-insensitive name/text matching (pg_trgm when available).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type", "all")
        try:
            limit = min(int(request.query_params.get("limit", 20)), 50)
        except (ValueError, TypeError):
            limit = 20

        if not q:
            return Response({"data": {"venues": [], "users": [], "reviews": []}})

        result = {}

        if search_type in ("all", "venue"):
            venues = Venue.objects.filter(
                Q(name__icontains=q)
                | Q(cuisine_type__icontains=q)
                | json_array_contains("tags", [q])
            ).order_by("-rating")[:limit]
            result["venues"] = VenueListSerializer(venues, many=True).data

        if search_type in ("all", "user"):
            users = User.objects.filter(
                Q(name__icontains=q)
            )[:limit]
            result["users"] = UserPublicSerializer(users, many=True).data

        if search_type in ("all", "review"):
            reviews = Review.objects.filter(
                Q(text__icontains=q)
                | Q(dish_name__icontains=q)
                | json_array_contains("tags", [q])
            ).select_related("user", "venue").order_by("-created_at")[:limit]
            result["reviews"] = ReviewSerializer(
                reviews, many=True, context={"request": request}
            ).data

        # For single-type searches, return flat array
        if search_type != "all" and search_type in result:
            return Response({"data": result[search_type]})

        return Response({"data": result})


class AutocompleteView(APIView):
    """
    GET /api/search/autocomplete/?q=...

    Lightweight autocomplete — max 10 results, uniform shape.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type", "all")

        if not q or len(q) < 1:
            return Response({"data": []})

        results = []

        if search_type in ("all", "venue"):
            venues = Venue.objects.filter(
                name__icontains=q
            ).order_by("-rating")[:5]
            for v in venues:
                results.append({
                    "type": "venue",
                    "id": str(v.id),
                    "title": v.name,
                    "subtitle": f"{v.cuisine_type} - {v.location_text}",
                    "image_url": v.photo_url,
                })

        if search_type in ("all", "user"):
            users = User.objects.filter(
                name__icontains=q
            )[:5]
            for u in users:
                results.append({
                    "type": "user",
                    "id": str(u.id),
                    "title": u.name,
                    "subtitle": f"Level {u.level}",
                    "image_url": u.avatar_url,
                })

        return Response({"data": results[:10]})

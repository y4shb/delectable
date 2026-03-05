from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.db import json_array_contains
from apps.users.models import User
from apps.users.serializers import UserPublicSerializer
from apps.venues.models import Dish, Venue, VenueOccasion, DietaryReport
from apps.venues.serializers import DishListSerializer, VenueListSerializer
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer

from .parser import parse_search_query


class SearchView(APIView):
    """
    GET /api/search/?q=...&type=all|venue|user|review|dish&occasion=...&dietary=...

    Unified search across venues, users, reviews, and dishes.
    Uses case-insensitive name/text matching (pg_trgm when available).
    Integrates smart search parser for natural language queries.
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
            return Response({"data": {"venues": [], "users": [], "reviews": [], "dishes": []}})

        # Parse the query for structured filters
        parsed = parse_search_query(q)
        search_text = parsed["remaining_text"] or q

        # Get explicit filter params (override parsed)
        occasion_filter = request.query_params.get("occasion") or parsed.get("occasion")
        dietary_param = request.query_params.get("dietary", "")
        dietary_filters = [d.strip() for d in dietary_param.split(",") if d.strip()] if dietary_param else parsed.get("dietary", [])

        result = {}

        if search_type in ("all", "venue"):
            venues = Venue.objects.filter(
                Q(name__icontains=search_text)
                | Q(cuisine_type__icontains=search_text)
                | json_array_contains("tags", [search_text])
            )

            # Apply cuisine filter from parser
            if parsed.get("cuisine"):
                venues = venues.filter(cuisine_type__icontains=parsed["cuisine"])

            # Apply occasion filter
            if occasion_filter:
                venue_ids_for_occasion = VenueOccasion.objects.filter(
                    occasion__slug=occasion_filter
                ).values_list("venue_id", flat=True)
                venues = venues.filter(id__in=venue_ids_for_occasion)

            # Apply dietary filter
            if dietary_filters:
                for diet in dietary_filters:
                    venue_ids_for_diet = DietaryReport.objects.filter(
                        category=diet, is_available=True
                    ).values_list("venue_id", flat=True)
                    venues = venues.filter(id__in=venue_ids_for_diet)

            venues = venues.order_by("-rating")[:limit]
            result["venues"] = VenueListSerializer(venues, many=True).data

        if search_type in ("all", "user"):
            users = User.objects.filter(
                Q(name__icontains=search_text)
            )[:limit]
            result["users"] = UserPublicSerializer(users, many=True).data

        if search_type in ("all", "review"):
            reviews = Review.objects.filter(
                Q(text__icontains=search_text)
                | Q(dish_name__icontains=search_text)
                | json_array_contains("tags", [search_text])
            ).select_related("user", "venue").order_by("-created_at")[:limit]
            result["reviews"] = ReviewSerializer(
                reviews, many=True, context={"request": request}
            ).data

        if search_type in ("all", "dish"):
            dishes = Dish.objects.filter(
                name__icontains=search_text
            ).select_related("venue").order_by("-review_count")[:limit]
            result["dishes"] = DishListSerializer(dishes, many=True).data

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

        if search_type in ("all", "dish"):
            dishes = Dish.objects.filter(
                name__icontains=q
            ).select_related("venue")[:5]
            for d in dishes:
                results.append({
                    "type": "dish",
                    "id": str(d.id),
                    "title": d.name,
                    "subtitle": f"@ {d.venue.name}",
                    "image_url": d.venue.photo_url,
                })

        return Response({"data": results[:10]})

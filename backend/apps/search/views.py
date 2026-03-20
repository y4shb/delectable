from django.db import connection
from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.db import json_array_contains
from apps.core.permissions import ReadPublicWriteAuthenticated
from apps.users.models import User
from apps.users.serializers import UserPublicSerializer
from apps.venues.models import Dish, Venue, VenueOccasion, DietaryReport
from apps.venues.serializers import DishListSerializer, VenueListSerializer
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer

from .parser import parse_search_query


def _is_postgres():
    """Return True when the default database is PostgreSQL."""
    return connection.vendor == "postgresql"


class SearchView(APIView):
    """
    GET /api/search/?q=...&type=all|venue|user|review|dish&occasion=...&dietary=...

    Unified search across venues, users, reviews, and dishes.

    On PostgreSQL the view uses full-text search (tsvector + tsquery) for
    ranked results, combined with trigram similarity (pg_trgm) for
    typo-tolerant fuzzy matching.  On SQLite it falls back to icontains.

    Supports anonymous access for content-first onboarding.
    """

    permission_classes = [ReadPublicWriteAuthenticated]

    # ------------------------------------------------------------------
    # Venue search helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _search_venues_postgres(search_text, limit):
        """Full-text + fuzzy venue search on PostgreSQL."""
        from apps.search.backends import full_text_search_venues, fuzzy_search_venues

        # Full-text ranked results come first
        ft_qs = full_text_search_venues(search_text, limit=limit)
        ft_ids = set(ft_qs.values_list("id", flat=True))

        # Fuzzy matches catch typos that full-text misses
        fuzzy_qs = fuzzy_search_venues(search_text, threshold=0.3)
        fuzzy_ids = set(fuzzy_qs.values_list("id", flat=True))

        # Combine: full-text first, then any extra fuzzy hits
        combined_ids = list(ft_ids) + [fid for fid in fuzzy_ids if fid not in ft_ids]
        combined_ids = combined_ids[:limit]

        if not combined_ids:
            return Venue.objects.none()

        # Preserve the ordering (full-text matches before fuzzy)
        preserved = {pk: idx for idx, pk in enumerate(combined_ids)}
        return sorted(
            Venue.objects.filter(id__in=combined_ids),
            key=lambda v: preserved.get(v.id, 999),
        )

    @staticmethod
    def _search_venues_sqlite(search_text):
        """Fallback icontains search for SQLite."""
        return Venue.objects.filter(
            Q(name__icontains=search_text)
            | Q(cuisine_type__icontains=search_text)
            | json_array_contains("tags", [search_text])
        )

    # ------------------------------------------------------------------
    # Dish search helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _search_dishes_postgres(search_text, limit):
        """Fuzzy dish search on PostgreSQL."""
        from apps.search.backends import fuzzy_search_dishes

        return fuzzy_search_dishes(search_text, threshold=0.3).select_related(
            "venue"
        )[:limit]

    @staticmethod
    def _search_dishes_sqlite(search_text, limit):
        """Fallback icontains dish search for SQLite."""
        return (
            Dish.objects.filter(name__icontains=search_text)
            .select_related("venue")
            .order_by("-review_count")[:limit]
        )

    # ------------------------------------------------------------------
    # Main handler
    # ------------------------------------------------------------------

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

        use_pg = _is_postgres()
        result = {}

        if search_type in ("all", "venue"):
            if use_pg:
                venues = self._search_venues_postgres(search_text, limit)
            else:
                venues = self._search_venues_sqlite(search_text)

            # If venues came back as a list (postgres path), convert IDs for
            # further filtering; otherwise keep as queryset.
            if isinstance(venues, list):
                venue_ids = [v.id for v in venues]
                venues_qs = Venue.objects.filter(id__in=venue_ids)
            else:
                venues_qs = venues

            # Apply cuisine filter from parser
            if parsed.get("cuisine"):
                venues_qs = venues_qs.filter(cuisine_type__icontains=parsed["cuisine"])

            # Apply occasion filter
            if occasion_filter:
                venue_ids_for_occasion = VenueOccasion.objects.filter(
                    occasion__slug=occasion_filter
                ).values_list("venue_id", flat=True)
                venues_qs = venues_qs.filter(id__in=venue_ids_for_occasion)

            # Apply dietary filter
            if dietary_filters:
                for diet in dietary_filters:
                    venue_ids_for_diet = DietaryReport.objects.filter(
                        category=diet, is_available=True
                    ).values_list("venue_id", flat=True)
                    venues_qs = venues_qs.filter(id__in=venue_ids_for_diet)

            # Final ordering / slicing
            if use_pg and isinstance(venues, list):
                # Re-filter the pre-ordered list to respect additional filters
                allowed_ids = set(venues_qs.values_list("id", flat=True))
                final_venues = [v for v in venues if v.id in allowed_ids][:limit]
                result["venues"] = VenueListSerializer(final_venues, many=True).data
            else:
                venues_qs = venues_qs.order_by("-rating")[:limit]
                result["venues"] = VenueListSerializer(venues_qs, many=True).data

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
            if use_pg:
                dishes = self._search_dishes_postgres(search_text, limit)
            else:
                dishes = self._search_dishes_sqlite(search_text, limit)
            result["dishes"] = DishListSerializer(dishes, many=True).data

        # For single-type searches, return flat array
        if search_type != "all" and search_type in result:
            return Response({"data": result[search_type]})

        return Response({"data": result})


class AutocompleteView(APIView):
    """
    GET /api/search/autocomplete/?q=...

    Lightweight autocomplete -- max 10 results, uniform shape.
    On PostgreSQL, uses trigram similarity for typo-tolerant matching.
    On SQLite, falls back to icontains.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type", "all")

        if not q or len(q) < 1:
            return Response({"data": []})

        use_pg = _is_postgres()
        results = []

        if search_type in ("all", "venue"):
            if use_pg:
                from apps.search.backends import fuzzy_search_venues

                venues = fuzzy_search_venues(q, threshold=0.2)[:5]
            else:
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
            if use_pg:
                from apps.search.backends import fuzzy_search_dishes

                dishes = fuzzy_search_dishes(q, threshold=0.2).select_related("venue")[:5]
            else:
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

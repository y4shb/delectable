from datetime import date
from decimal import Decimal

from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.db import json_array_contains

from .models import SeasonalHighlight, Venue
from .serializers import SeasonalHighlightSerializer, VenueDetailSerializer, VenueListSerializer


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/venues/       — List venues (with filters: cuisine, tags, rating_min, bbox)
    GET /api/venues/{id}/  — Venue detail
    """

    queryset = Venue.objects.all()
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return VenueDetailSerializer
        return VenueListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Cuisine filter
        cuisine = params.get("cuisine")
        if cuisine:
            qs = qs.filter(cuisine_type__iexact=cuisine)

        # Tags filter (comma-separated, matches venues containing ALL tags)
        tags = params.get("tags")
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                qs = qs.filter(json_array_contains("tags", tag_list))

        # Minimum rating filter
        rating_min = params.get("rating_min")
        if rating_min:
            try:
                qs = qs.filter(rating__gte=Decimal(rating_min))
            except (ValueError, TypeError, ArithmeticError):
                pass

        # Price level filter
        price_level = params.get("price_level")
        if price_level:
            try:
                qs = qs.filter(price_level=int(price_level))
            except (ValueError, TypeError):
                pass
        price_max = params.get("price_max")
        if price_max:
            try:
                qs = qs.filter(price_level__lte=int(price_max))
            except (ValueError, TypeError):
                pass

        # Bounding box filter: bbox=sw_lat,sw_lng,ne_lat,ne_lng
        bbox = params.get("bbox")
        if bbox:
            try:
                parts = [Decimal(p.strip()) for p in bbox.split(",")]
                if len(parts) == 4:
                    sw_lat, sw_lng, ne_lat, ne_lng = parts
                    qs = qs.filter(
                        latitude__gte=sw_lat,
                        latitude__lte=ne_lat,
                        longitude__gte=sw_lng,
                        longitude__lte=ne_lng,
                    )
            except (ValueError, TypeError, ArithmeticError):
                pass

        # Radius filter: lat, lng, radius (meters)
        lat = params.get("lat")
        lng = params.get("lng")
        radius = params.get("radius")
        if lat and lng and radius:
            # Simple approximation without PostGIS
            # 1 degree latitude ≈ 111km
            # 1 degree longitude ≈ 111km * cos(latitude)
            import math
            try:
                lat_val = Decimal(lat)
                lng_val = Decimal(lng)
                radius_km = Decimal(radius) / 1000
                lat_delta = radius_km / Decimal("111.0")
                # Adjust longitude delta for latitude (cos correction)
                lat_radians = float(lat_val) * math.pi / 180
                lng_correction = Decimal(str(max(math.cos(lat_radians), 0.1)))
                lng_delta = radius_km / (Decimal("111.0") * lng_correction)
                qs = qs.filter(
                    latitude__gte=lat_val - lat_delta,
                    latitude__lte=lat_val + lat_delta,
                    longitude__gte=lng_val - lng_delta,
                    longitude__lte=lng_val + lng_delta,
                )
            except (ValueError, TypeError, ArithmeticError, ZeroDivisionError):
                pass

        # Sort
        sort = params.get("sort", "rating")
        if sort == "recent":
            qs = qs.order_by("-created_at")
        elif sort == "distance" and lat and lng:
            # Without PostGIS, we can't sort by true distance
            # Just use default rating sort
            qs = qs.order_by("-rating")
        else:
            qs = qs.order_by("-rating")

        return qs


class SeasonalHighlightsView(APIView):
    """GET /api/venues/seasonal/ — Active seasonal highlights for current season."""

    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _get_current_season():
        """Determine season from current date."""
        month = date.today().month
        if month in (3, 4, 5):
            return "spring"
        elif month in (6, 7, 8):
            return "summer"
        elif month in (9, 10, 11):
            return "fall"
        else:
            return "winter"

    def get(self, request):
        season = request.query_params.get("season", self._get_current_season())
        today = date.today()

        highlights = SeasonalHighlight.objects.filter(
            season=season,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        ).select_related("venue")

        serializer = SeasonalHighlightSerializer(highlights, many=True)
        return Response({
            "season": season,
            "data": serializer.data,
        })

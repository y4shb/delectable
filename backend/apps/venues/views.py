from datetime import date
from decimal import Decimal

from django.db import connection
from django.db.models import Prefetch
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.db import json_array_contains

from .models import DietaryReport, Dish, SeasonalHighlight, Venue, VenueOccasion
from .serializers import SeasonalHighlightSerializer, VenueDetailSerializer, VenueListSerializer


def _is_postgres():
    """Return True when the default database is PostgreSQL."""
    return connection.vendor == "postgresql"


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/venues/       -- List venues (with filters: cuisine, tags, rating_min, bbox)
    GET /api/venues/{id}/  -- Venue detail

    Spatial filters (bbox and radius) use PostGIS when available,
    falling back to Decimal-based approximations on SQLite.
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

        # Prefetch related data for detail view to avoid N+1 queries
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "occasions",
                    queryset=VenueOccasion.objects.select_related("occasion").order_by("-vote_count"),
                ),
                Prefetch(
                    "dietary_reports",
                    queryset=DietaryReport.objects.all(),
                ),
                Prefetch(
                    "dishes",
                    queryset=Dish.objects.order_by("-review_count")[:10],
                    to_attr="_prefetched_dishes",
                ),
            )

        params = self.request.query_params
        use_pg = _is_postgres()

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

        # ------------------------------------------------------------------
        # Bounding box filter: bbox=sw_lat,sw_lng,ne_lat,ne_lng
        # ------------------------------------------------------------------
        bbox = params.get("bbox")
        if bbox:
            try:
                parts = [p.strip() for p in bbox.split(",")]
                if len(parts) == 4:
                    sw_lat, sw_lng, ne_lat, ne_lng = parts
                    if use_pg:
                        qs = self._bbox_postgis(qs, sw_lat, sw_lng, ne_lat, ne_lng)
                    else:
                        qs = self._bbox_decimal(qs, sw_lat, sw_lng, ne_lat, ne_lng)
            except (ValueError, TypeError, ArithmeticError):
                pass

        # Also support individual sw_lat/sw_lng/ne_lat/ne_lng params
        sw_lat_p = params.get("sw_lat")
        sw_lng_p = params.get("sw_lng")
        ne_lat_p = params.get("ne_lat")
        ne_lng_p = params.get("ne_lng")
        if sw_lat_p and sw_lng_p and ne_lat_p and ne_lng_p and not bbox:
            try:
                if use_pg:
                    qs = self._bbox_postgis(qs, sw_lat_p, sw_lng_p, ne_lat_p, ne_lng_p)
                else:
                    qs = self._bbox_decimal(qs, sw_lat_p, sw_lng_p, ne_lat_p, ne_lng_p)
            except (ValueError, TypeError, ArithmeticError):
                pass

        # ------------------------------------------------------------------
        # Radius filter: lat, lng, radius (meters)
        # ------------------------------------------------------------------
        lat = params.get("lat")
        lng = params.get("lng")
        radius = params.get("radius")
        if lat and lng and radius:
            try:
                if use_pg:
                    qs = self._radius_postgis(qs, lat, lng, radius)
                else:
                    qs = self._radius_decimal(qs, lat, lng, radius)
            except (ValueError, TypeError, ArithmeticError, ZeroDivisionError):
                pass

        # ------------------------------------------------------------------
        # Sort
        # ------------------------------------------------------------------
        sort = params.get("sort", "rating")
        if sort == "recent":
            qs = qs.order_by("-created_at")
        elif sort == "distance" and lat and lng and use_pg:
            qs = self._sort_by_distance(qs, lat, lng)
        else:
            qs = qs.order_by("-rating")

        return qs

    # ------------------------------------------------------------------
    # PostGIS spatial helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _bbox_postgis(qs, sw_lat, sw_lng, ne_lat, ne_lng):
        """Bounding box filter using PostGIS __within."""
        from django.contrib.gis.geos import Polygon

        bbox_poly = Polygon.from_bbox(
            (float(sw_lng), float(sw_lat), float(ne_lng), float(ne_lat))
        )
        bbox_poly.srid = 4326
        return qs.filter(location__within=bbox_poly)

    @staticmethod
    def _bbox_decimal(qs, sw_lat, sw_lng, ne_lat, ne_lng):
        """Bounding box filter using Decimal lat/lng columns (SQLite)."""
        return qs.filter(
            latitude__gte=Decimal(sw_lat),
            latitude__lte=Decimal(ne_lat),
            longitude__gte=Decimal(sw_lng),
            longitude__lte=Decimal(ne_lng),
        )

    @staticmethod
    def _radius_postgis(qs, lat, lng, radius):
        """Radius filter using PostGIS ST_DWithin (geography)."""
        from django.contrib.gis.geos import Point
        from django.contrib.gis.measure import D

        point = Point(float(lng), float(lat), srid=4326)
        return qs.filter(location__distance_lte=(point, D(m=float(radius))))

    @staticmethod
    def _radius_decimal(qs, lat, lng, radius):
        """Approximate radius filter using Decimal lat/lng (SQLite fallback)."""
        import math

        lat_val = Decimal(lat)
        lng_val = Decimal(lng)
        radius_km = Decimal(radius) / 1000
        lat_delta = radius_km / Decimal("111.0")
        lat_radians = float(lat_val) * math.pi / 180
        lng_correction = Decimal(str(max(math.cos(lat_radians), 0.1)))
        lng_delta = radius_km / (Decimal("111.0") * lng_correction)
        return qs.filter(
            latitude__gte=lat_val - lat_delta,
            latitude__lte=lat_val + lat_delta,
            longitude__gte=lng_val - lng_delta,
            longitude__lte=lng_val + lng_delta,
        )

    @staticmethod
    def _sort_by_distance(qs, lat, lng):
        """Sort results by distance from a point using PostGIS."""
        from django.contrib.gis.db.models.functions import Distance
        from django.contrib.gis.geos import Point

        point = Point(float(lng), float(lat), srid=4326)
        return qs.annotate(distance=Distance("location", point)).order_by("distance")


class SeasonalHighlightsView(APIView):
    """GET /api/venues/seasonal/ -- Active seasonal highlights for current season."""

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

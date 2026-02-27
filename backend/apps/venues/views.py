from decimal import Decimal

from rest_framework import permissions, viewsets

from apps.core.db import json_array_contains

from .models import Venue
from .serializers import VenueDetailSerializer, VenueListSerializer


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
            except Exception:
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
            except Exception:
                pass

        # Radius filter: lat, lng, radius (meters)
        lat = params.get("lat")
        lng = params.get("lng")
        radius = params.get("radius")
        if lat and lng and radius:
            # Simple approximation without PostGIS
            # 1 degree latitude ≈ 111km
            try:
                lat_val = Decimal(lat)
                lng_val = Decimal(lng)
                radius_km = Decimal(radius) / 1000
                lat_delta = radius_km / Decimal("111.0")
                lng_delta = radius_km / Decimal("111.0")
                qs = qs.filter(
                    latitude__gte=lat_val - lat_delta,
                    latitude__lte=lat_val + lat_delta,
                    longitude__gte=lng_val - lng_delta,
                    longitude__lte=lng_val + lng_delta,
                )
            except Exception:
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

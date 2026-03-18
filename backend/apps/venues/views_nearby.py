"""Nearby saved venues view for smart nudges."""

from decimal import Decimal
from math import cos, radians

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.playlists.models import Playlist, PlaylistItem
from apps.reviews.models import Bookmark

from .models import Venue
from .serializers import VenueListSerializer


class NearbySavedVenuesView(APIView):
    """GET /api/venues/nearby-saved/?lat=&lng=&radius= — Venues user saved that are nearby."""

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = request.query_params.get("radius", "500")  # Default 500 meters

        if not lat or not lng:
            return Response({"data": []})

        try:
            lat_val = Decimal(lat)
            lng_val = Decimal(lng)
            radius_m = float(radius)
        except (ValueError, TypeError):
            return Response({"data": []})

        # Get user's saved venues (from bookmarks and playlists)
        saved_venue_ids = set()

        # From bookmarks
        bookmarked_reviews = Bookmark.objects.filter(user=request.user).values_list(
            "review__venue_id", flat=True
        )
        saved_venue_ids.update(vid for vid in bookmarked_reviews if vid)

        # From playlists
        playlist_ids = Playlist.objects.filter(
            user=request.user
        ).values_list("id", flat=True)
        playlist_venues = PlaylistItem.objects.filter(
            playlist_id__in=playlist_ids
        ).values_list("venue_id", flat=True)
        saved_venue_ids.update(playlist_venues)

        if not saved_venue_ids:
            return Response({"data": []})

        # Calculate bounding box
        radius_km = radius_m / 1000
        lat_delta = Decimal(str(radius_km / 111.0))
        lng_delta = Decimal(str(radius_km / (111.0 * cos(radians(float(lat_val))))))

        # Filter nearby venues
        venues = Venue.objects.filter(
            id__in=saved_venue_ids,
            latitude__gte=lat_val - lat_delta,
            latitude__lte=lat_val + lat_delta,
            longitude__gte=lng_val - lng_delta,
            longitude__lte=lng_val + lng_delta,
        )

        serializer = VenueListSerializer(venues, many=True)
        return Response({"data": serializer.data})

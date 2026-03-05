from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import VenueSimilarity
from .serializers import VenueListSerializer


class SimilarVenuesView(APIView):
    """GET /api/venues/<id>/similar/ — Top 6 similar venues."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        similarities = (
            VenueSimilarity.objects.filter(venue_a_id=id)
            .select_related("venue_b")
            .order_by("-score")[:6]
        )
        venues = [s.venue_b for s in similarities]
        serializer = VenueListSerializer(venues, many=True)
        return Response({"results": serializer.data})

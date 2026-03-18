from django.db import transaction
from django.db.models import F
from django.db.models.functions import Greatest
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OccasionTag, OccasionVote, VenueOccasion
from .serializers import OccasionTagSerializer


class OccasionTagListView(generics.ListAPIView):
    """GET /api/occasions/ — List all occasion tags."""

    queryset = OccasionTag.objects.all()
    serializer_class = OccasionTagSerializer
    permission_classes = [permissions.AllowAny]


class OccasionVoteView(APIView):
    """POST/DELETE /api/venues/<id>/occasions/<slug>/vote/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id, slug):
        with transaction.atomic():
            _, created = OccasionVote.objects.get_or_create(
                user=request.user, venue_id=id, occasion_id=slug
            )
            if not created:
                return Response(
                    {"error": {"code": "CONFLICT", "message": "Already voted.", "status": 409}},
                    status=status.HTTP_409_CONFLICT,
                )
            vo, _ = VenueOccasion.objects.get_or_create(
                venue_id=id, occasion_id=slug
            )
            VenueOccasion.objects.filter(pk=vo.pk).update(vote_count=F("vote_count") + 1)
        return Response({"data": {"venue_id": str(id), "occasion": slug}}, status=status.HTTP_201_CREATED)

    def delete(self, request, id, slug):
        with transaction.atomic():
            deleted, _ = OccasionVote.objects.filter(
                user=request.user, venue_id=id, occasion_id=slug
            ).delete()
            if not deleted:
                return Response(status=status.HTTP_404_NOT_FOUND)
            VenueOccasion.objects.filter(venue_id=id, occasion_id=slug).update(
                vote_count=Greatest(F("vote_count") - 1, 0)
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.reviews.models import Review

from .models import VenueOwner, VenueResponse
from .serializers import VenueResponseCreateSerializer, VenueResponseSerializer


class VenueResponseView(generics.GenericAPIView):
    """
    GET  /api/reviews/<id>/response/ — Get venue owner response for a review.
    POST /api/reviews/<id>/response/ — Create venue owner response for a review.
    """

    lookup_field = "id"

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, id):
        try:
            response = VenueResponse.objects.select_related("responder").get(
                review_id=id
            )
        except VenueResponse.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = VenueResponseSerializer(response)
        return Response({"data": serializer.data})

    def post(self, request, id):
        review = generics.get_object_or_404(Review, id=id)

        # Verify the user is a verified owner/manager of the venue
        is_owner = VenueOwner.objects.filter(
            user=request.user, venue=review.venue, is_verified=True
        ).exists()
        if not is_owner:
            return Response(
                {
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Only verified venue owners can respond to reviews.",
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent duplicate responses
        if VenueResponse.objects.filter(review=review).exists():
            return Response(
                {
                    "error": {
                        "code": "CONFLICT",
                        "message": "A response already exists for this review.",
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = VenueResponseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        venue_response = serializer.save(review=review, responder=request.user)
        return Response(
            {"data": VenueResponseSerializer(venue_response).data},
            status=status.HTTP_201_CREATED,
        )

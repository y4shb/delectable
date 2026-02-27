from django.db import models as db_models
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import FeedCursorPagination
from apps.core.permissions import IsOwnerOrReadOnly

from .models import Comment, Review, ReviewLike
from .serializers import CommentSerializer, ReviewCreateSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    CRUD for reviews.
    POST /api/reviews/       — Create
    GET /api/reviews/{id}/   — Detail
    PATCH /api/reviews/{id}/ — Update (owner only)
    DELETE /api/reviews/{id}/ — Delete (owner only)
    """

    queryset = Review.objects.select_related("user", "venue").all()
    lookup_field = "id"
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        # Update venue review count and rating
        venue = review.venue
        from django.db.models import Avg
        agg = Review.objects.filter(venue=venue).aggregate(
            avg_rating=Avg("rating"),
            count=db_models.Count("id"),
        )
        venue.rating = agg["avg_rating"] or 0
        venue.reviews_count = agg["count"]
        venue.save(update_fields=["rating", "reviews_count"])

    def perform_destroy(self, instance):
        venue = instance.venue
        instance.delete()
        # Recalculate venue stats
        from django.db.models import Avg
        agg = Review.objects.filter(venue=venue).aggregate(
            avg_rating=Avg("rating"),
            count=db_models.Count("id"),
        )
        venue.rating = agg["avg_rating"] or 0
        venue.reviews_count = agg["count"]
        venue.save(update_fields=["rating", "reviews_count"])


class VenueReviewsView(generics.ListAPIView):
    """GET /api/venues/{id}/reviews/ — Reviews for a venue."""

    serializer_class = ReviewSerializer
    pagination_class = FeedCursorPagination
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        venue_id = self.kwargs["id"]
        return (
            Review.objects.filter(venue_id=venue_id)
            .select_related("user", "venue")
            .order_by("-created_at")
        )


class UserReviewsView(generics.ListAPIView):
    """GET /api/auth/users/{id}/reviews/ — Reviews by a user."""

    serializer_class = ReviewSerializer
    pagination_class = FeedCursorPagination
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.kwargs["id"]
        return (
            Review.objects.filter(user_id=user_id)
            .select_related("user", "venue")
            .order_by("-created_at")
        )


class LikeView(APIView):
    """POST/DELETE /api/reviews/{id}/like/ — Like/unlike a review."""

    def post(self, request, id):
        review = generics.get_object_or_404(Review, id=id)
        _, created = ReviewLike.objects.get_or_create(
            user=request.user, review=review
        )
        if not created:
            return Response(
                {"error": {"code": "CONFLICT", "message": "Already liked.", "status": 409}},
                status=status.HTTP_409_CONFLICT,
            )
        Review.objects.filter(id=id).update(like_count=db_models.F("like_count") + 1)
        return Response(
            {"data": {"review_id": str(id), "user_id": str(request.user.id)}},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        deleted, _ = ReviewLike.objects.filter(
            user=request.user, review_id=id
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        Review.objects.filter(id=id).update(like_count=db_models.F("like_count") - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/reviews/{id}/comments/"""

    serializer_class = CommentSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return Comment.objects.filter(
            review_id=self.kwargs["id"]
        ).select_related("user").order_by("created_at")

    def perform_create(self, serializer):
        review = generics.get_object_or_404(Review, id=self.kwargs["id"])
        serializer.save(user=self.request.user, review=review)
        Review.objects.filter(id=review.id).update(
            comment_count=db_models.F("comment_count") + 1
        )


class CommentDeleteView(generics.DestroyAPIView):
    """DELETE /api/reviews/{rid}/comments/{cid}/"""

    queryset = Comment.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "cid"

    def get_queryset(self):
        return Comment.objects.filter(
            review_id=self.kwargs["rid"],
            user=self.request.user,
        )

    def perform_destroy(self, instance):
        review_id = instance.review_id
        instance.delete()
        Review.objects.filter(id=review_id).update(
            comment_count=db_models.F("comment_count") - 1
        )

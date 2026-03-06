from django.db import models as db_models, transaction
from django.db.models.functions import Greatest
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import FeedCursorPagination
from apps.core.permissions import IsOwnerOrReadOnly

from .models import Bookmark, Comment, Review, ReviewLike, WantToTry
from .serializers import (
    BookmarkSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    QuickReviewSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
    WantToTrySerializer,
)


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
        with transaction.atomic():
            review = serializer.save(user=self.request.user)
            # Compute and save quality score
            from apps.feed.engine import compute_quality_score
            review.quality_score = compute_quality_score(review)
            review.save(update_fields=["quality_score"])
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

            # Award XP for review
            from apps.gamification.services import award_xp, record_activity
            award_xp(self.request.user, "review", related_object_id=review.id)
            if review.photo_url:
                award_xp(self.request.user, "review_photo", related_object_id=review.id)
            record_activity(self.request.user, "review")

    def perform_update(self, serializer):
        review = serializer.save()
        from apps.feed.engine import compute_quality_score
        review.quality_score = compute_quality_score(review)
        review.save(update_fields=["quality_score"])

    def perform_destroy(self, instance):
        with transaction.atomic():
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

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "likes"

    def post(self, request, id):
        with transaction.atomic():
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
            # Create notification for review owner
            if review.user_id != request.user.id:
                from apps.notifications.services import create_notification
                create_notification(
                    recipient=review.user,
                    notification_type="like",
                    text=f"{request.user.name} liked your review",
                    actor=request.user,
                    related_object_id=review.id,
                    group_key=f"like:{review.id}",
                )
                # Award XP to review owner for receiving a like
                from apps.gamification.services import award_xp
                award_xp(review.user, "like_received", related_object_id=review.id)
            # Award XP to liker
            from apps.gamification.services import award_xp
            award_xp(request.user, "like_given", related_object_id=review.id)
        return Response(
            {"data": {"review_id": str(id), "user_id": str(request.user.id)}},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        with transaction.atomic():
            deleted, _ = ReviewLike.objects.filter(
                user=request.user, review_id=id
            ).delete()
            if not deleted:
                return Response(status=status.HTTP_404_NOT_FOUND)
            Review.objects.filter(id=id).update(like_count=Greatest(db_models.F("like_count") - 1, 0))
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookmarkView(APIView):
    """POST/DELETE /api/reviews/{id}/bookmark/ — Bookmark/unbookmark a review."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        with transaction.atomic():
            review = generics.get_object_or_404(Review, id=id)
            _, created = Bookmark.objects.get_or_create(
                user=request.user, review=review
            )
            if not created:
                return Response(
                    {"error": {"code": "CONFLICT", "message": "Already bookmarked.", "status": 409}},
                    status=status.HTTP_409_CONFLICT,
                )
        return Response(
            {"data": {"review_id": str(id), "user_id": str(request.user.id)}},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        with transaction.atomic():
            deleted, _ = Bookmark.objects.filter(
                user=request.user, review_id=id
            ).delete()
            if not deleted:
                return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookmarkListView(generics.ListAPIView):
    """GET /api/bookmarks/ — User's bookmarked reviews."""

    serializer_class = BookmarkSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return (
            Bookmark.objects.filter(user=self.request.user)
            .select_related("review__user", "review__venue")
            .order_by("-created_at")
        )


class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/reviews/{id}/comments/"""

    pagination_class = FeedCursorPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["review_id"] = self.kwargs["id"]
        return context

    def get_queryset(self):
        return (
            Comment.objects.filter(
                review_id=self.kwargs["id"], parent__isnull=True
            )
            .select_related("user")
            .prefetch_related("replies__user")
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        with transaction.atomic():
            review = generics.get_object_or_404(Review, id=self.kwargs["id"])
            comment = serializer.save(user=self.request.user, review=review)
            Review.objects.filter(id=review.id).update(
                comment_count=db_models.F("comment_count") + 1
            )
            # Create notification for review owner
            if review.user_id != self.request.user.id:
                from apps.notifications.services import create_notification
                create_notification(
                    recipient=review.user,
                    notification_type="comment",
                    text=f"{self.request.user.name} commented on your review",
                    actor=self.request.user,
                    related_object_id=review.id,
                    group_key=f"comment:{review.id}",
                )
            # Award XP for commenting
            from apps.gamification.services import award_xp, record_activity
            award_xp(self.request.user, "comment", related_object_id=comment.id)
            record_activity(self.request.user, "comment")


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
        with transaction.atomic():
            review_id = instance.review_id
            # Count replies too
            reply_count = instance.replies.count()
            instance.delete()
            Review.objects.filter(id=review_id).update(
                comment_count=Greatest(db_models.F("comment_count") - 1 - reply_count, 0)
            )


class QuickReviewView(APIView):
    """
    POST /api/reviews/quick/ — Simplified first-review wizard.

    Accepts: photo_url, venue_id, rating (required only)
    Optional: dish_name, text, tags

    Updates maturity_level on first review.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reviews"

    def post(self, request):
        serializer = QuickReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Check if this is user's first review
            is_first_review = not Review.objects.filter(user=request.user).exists()

            review = serializer.save(user=request.user)

            # Compute and save quality score
            from apps.feed.engine import compute_quality_score
            review.quality_score = compute_quality_score(review)
            review.save(update_fields=["quality_score"])

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

            # Update maturity level on first review
            if is_first_review:
                from apps.feed.models import UserTasteProfile
                profile, _ = UserTasteProfile.objects.get_or_create(user=request.user)
                if profile.maturity_level < 1:
                    profile.maturity_level = 1
                    profile.save(update_fields=["maturity_level"])

            # Award XP for review
            from apps.gamification.services import award_xp, record_activity
            if is_first_review:
                award_xp(request.user, "first_review", related_object_id=review.id)
            else:
                award_xp(request.user, "review", related_object_id=review.id)
            if review.photo_url:
                award_xp(request.user, "review_photo", related_object_id=review.id)
            record_activity(request.user, "review")

        response_serializer = ReviewSerializer(review, context={"request": request})
        return Response(
            {
                "data": response_serializer.data,
                "is_first_review": is_first_review,
            },
            status=status.HTTP_201_CREATED,
        )


class WantToTryListView(generics.ListCreateAPIView):
    """GET /api/want-to-try/ — List user's want-to-try venues.
    POST /api/want-to-try/ — Add a venue to want-to-try."""

    serializer_class = WantToTrySerializer

    def get_queryset(self):
        return (
            WantToTry.objects.filter(user=self.request.user)
            .select_related("venue")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WantToTryDetailView(generics.DestroyAPIView):
    """DELETE /api/want-to-try/{pk}/ — Remove from want-to-try."""

    serializer_class = WantToTrySerializer
    lookup_field = "pk"

    def get_queryset(self):
        return WantToTry.objects.filter(user=self.request.user)

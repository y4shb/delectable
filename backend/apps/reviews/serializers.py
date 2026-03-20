from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import DishListSerializer, VenueListSerializer

from .models import Bookmark, Comment, ContentReport, Review, ReviewPhoto, WantToTry


class CommentReplySerializer(serializers.ModelSerializer):
    """Serializer for reply comments (no nesting beyond depth 1)."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "user", "text", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer with embedded user and replies."""

    user = UserPublicSerializer(read_only=True)
    replies = CommentReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "user", "parent", "text", "replies", "created_at"]
        read_only_fields = ["id", "user", "replies", "created_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""

    text = serializers.CharField(max_length=2000)

    class Meta:
        model = Comment
        fields = ["text", "parent"]

    def validate_parent(self, value):
        if value is None:
            return value
        if value.parent is not None:
            raise serializers.ValidationError("Cannot reply to a reply.")
        review_id = self.context.get("review_id")
        if review_id and str(value.review_id) != str(review_id):
            raise serializers.ValidationError("Parent comment must belong to the same review.")
        return value


class ReviewPhotoSerializer(serializers.ModelSerializer):
    """Serializer for review photos."""

    class Meta:
        model = ReviewPhoto
        fields = ["id", "photo_url", "sort_order"]
        read_only_fields = ["id"]


class ReviewSerializer(serializers.ModelSerializer):
    """Full review serializer with embedded user and venue."""

    user = UserPublicSerializer(read_only=True)
    venue_detail = VenueListSerializer(source="venue", read_only=True)
    dish_detail = DishListSerializer(source="dish", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()
    photo_urls = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user", "venue", "venue_detail", "rating", "text",
            "photo_url", "photo_urls", "dish_name", "dish", "dish_detail", "tags", "like_count",
            "comment_count", "is_liked", "is_bookmarked",
            "recent_comments", "created_at",
        ]
        read_only_fields = [
            "id", "user", "like_count", "comment_count",
            "is_liked", "is_bookmarked", "recent_comments", "created_at",
        ]

    def get_is_liked(self, obj):
        if hasattr(obj, '_is_liked'):
            return obj._is_liked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        if hasattr(obj, '_is_bookmarked'):
            return obj._is_bookmarked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_photo_urls(self, obj):
        """Return all photo URLs: primary photo_url + additional ReviewPhotos."""
        urls = []
        if obj.photo_url:
            urls.append(obj.photo_url)
        # Use prefetched photos if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'photos' in obj._prefetched_objects_cache:
            additional = [p.photo_url for p in obj.photos.all()]
        else:
            additional = list(obj.photos.values_list("photo_url", flat=True).order_by("sort_order"))
        urls.extend(additional)
        return urls

    def get_recent_comments(self, obj):
        if hasattr(obj, '_recent_comments'):
            return CommentReplySerializer(obj._recent_comments, many=True).data
        comments = (
            obj.comments.filter(parent__isnull=True)
            .select_related("user")
            .order_by("-created_at")[:2]
        )
        return CommentReplySerializer(comments, many=True).data


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating reviews."""

    additional_photos = serializers.ListField(
        child=serializers.URLField(max_length=500),
        required=False,
        write_only=True,
        max_length=9,
    )

    class Meta:
        model = Review
        fields = ["venue", "rating", "text", "photo_url", "dish_name", "dish", "tags", "additional_photos"]

    def create(self, validated_data):
        additional_photos = validated_data.pop("additional_photos", [])
        review = super().create(validated_data)
        if additional_photos:
            ReviewPhoto.objects.bulk_create([
                ReviewPhoto(review=review, photo_url=url, sort_order=i)
                for i, url in enumerate(additional_photos)
            ])
        return review

    def update(self, instance, validated_data):
        additional_photos = validated_data.pop("additional_photos", None)
        review = super().update(instance, validated_data)
        if additional_photos is not None:
            review.photos.all().delete()
            ReviewPhoto.objects.bulk_create([
                ReviewPhoto(review=review, photo_url=url, sort_order=i)
                for i, url in enumerate(additional_photos)
            ])
        return review

    def validate_text(self, value):
        if value and len(value) < 10:
            raise serializers.ValidationError("Review text must be at least 10 characters.")
        return value

    def validate_tags(self, value):
        if value and len(value) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed.")
        return value


class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer for bookmarks with embedded review."""

    review_detail = ReviewSerializer(source="review", read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "review", "review_detail", "created_at"]
        read_only_fields = ["id", "review_detail", "created_at"]


class QuickReviewSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for first-review wizard.

    Only requires: venue, rating, photo_url
    Optional: dish_name, text, tags
    """

    class Meta:
        model = Review
        fields = ["venue", "rating", "photo_url", "dish_name", "text", "tags"]

    def validate_rating(self, value):
        if value < 0 or value > 10:
            raise serializers.ValidationError("Rating must be between 0 and 10.")
        return value

    def validate_photo_url(self, value):
        if not value:
            raise serializers.ValidationError("Photo is required for quick review.")
        return value


class ContentReportSerializer(serializers.ModelSerializer):
    """Serializer for content moderation reports."""

    class Meta:
        model = ContentReport
        fields = ["report_type", "content_type", "content_id", "reason"]

    def validate_reason(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError(
                "Reason must be 500 characters or fewer."
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        content_type = attrs.get("content_type")
        content_id = attrs.get("content_id")

        # Prevent self-reporting on reviews
        if content_type == ContentReport.ReportContentType.REVIEW:
            if Review.objects.filter(
                id=content_id, user=request.user
            ).exists():
                raise serializers.ValidationError(
                    "You cannot report your own content."
                )

        # Prevent self-reporting on comments
        if content_type == ContentReport.ReportContentType.COMMENT:
            from .models import Comment

            if Comment.objects.filter(
                id=content_id, user=request.user
            ).exists():
                raise serializers.ValidationError(
                    "You cannot report your own content."
                )

        return attrs


class WantToTrySerializer(serializers.ModelSerializer):
    """Serializer for Want to Try items with nested venue detail."""

    venue_detail = VenueListSerializer(source="venue", read_only=True)

    class Meta:
        model = WantToTry
        fields = ["id", "venue", "venue_detail", "note", "created_at"]
        read_only_fields = ["id", "venue_detail", "created_at"]

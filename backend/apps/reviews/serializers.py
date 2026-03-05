from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import DishListSerializer, VenueListSerializer

from .models import Bookmark, Comment, Review


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


class ReviewSerializer(serializers.ModelSerializer):
    """Full review serializer with embedded user and venue."""

    user = UserPublicSerializer(read_only=True)
    venue_detail = VenueListSerializer(source="venue", read_only=True)
    dish_detail = DishListSerializer(source="dish", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user", "venue", "venue_detail", "rating", "text",
            "photo_url", "dish_name", "dish", "dish_detail", "tags", "like_count",
            "comment_count", "is_liked", "is_bookmarked",
            "recent_comments", "created_at",
        ]
        read_only_fields = [
            "id", "user", "like_count", "comment_count",
            "is_liked", "is_bookmarked", "recent_comments", "created_at",
        ]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return getattr(obj, '_is_liked', obj.likes.filter(user=request.user).exists())
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return getattr(obj, '_is_bookmarked', obj.bookmarks.filter(user=request.user).exists())
        return False

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

    class Meta:
        model = Review
        fields = ["venue", "rating", "text", "photo_url", "dish_name", "dish", "tags"]

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

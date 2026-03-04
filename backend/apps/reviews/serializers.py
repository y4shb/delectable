from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import VenueListSerializer

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
        if value and value.parent_id is not None:
            raise serializers.ValidationError("Cannot reply to a reply (max depth 1).")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    """Full review serializer with embedded user and venue."""

    user = UserPublicSerializer(read_only=True)
    venue_detail = VenueListSerializer(source="venue", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user", "venue", "venue_detail", "rating", "text",
            "photo_url", "dish_name", "tags", "like_count",
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
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_recent_comments(self, obj):
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
        fields = ["venue", "rating", "text", "photo_url", "dish_name", "tags"]

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

from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer
from apps.venues.serializers import VenueListSerializer

from .models import Comment, Review


class ReviewSerializer(serializers.ModelSerializer):
    """Full review serializer with embedded user and venue."""

    user = UserPublicSerializer(read_only=True)
    venue_detail = VenueListSerializer(source="venue", read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user", "venue", "venue_detail", "rating", "text",
            "photo_url", "dish_name", "tags", "like_count",
            "comment_count", "is_liked", "created_at",
        ]
        read_only_fields = ["id", "user", "like_count", "comment_count", "created_at"]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


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


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer with embedded user."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "user", "text", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

from rest_framework import serializers

from .models import Notification, NotificationPreference


class ActorSerializer(serializers.Serializer):
    """Minimal user info for notification actor."""
    id = serializers.UUIDField()
    name = serializers.CharField()
    avatar_url = serializers.URLField(source="avatar_url", allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    actor = ActorSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "priority",
            "text",
            "related_object_id",
            "extra_data",
            "is_read",
            "bundle_count",
            "created_at",
            "actor",
        ]
        read_only_fields = fields


class MarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
    all = serializers.BooleanField(required=False, default=False)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "likes_enabled",
            "comments_enabled",
            "follows_enabled",
            "mentions_enabled",
            "trending_enabled",
            "streaks_enabled",
            "badges_enabled",
            "nudges_enabled",
            "digest_enabled",
            "nearby_enabled",
            "social_frequency",
            "digest_frequency",
            "push_enabled",
            "email_enabled",
            "sms_enabled",
            "quiet_hours_enabled",
            "quiet_hours_start",
            "quiet_hours_end",
            "timezone",
        ]

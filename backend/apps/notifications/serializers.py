from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "notification_type", "text",
            "related_object_id", "is_read", "created_at",
        ]
        read_only_fields = ["id", "notification_type", "text", "related_object_id", "created_at"]


class MarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
    all = serializers.BooleanField(required=False, default=False)

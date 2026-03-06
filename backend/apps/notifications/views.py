import json
import time

from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.renderers import BaseRenderer
from rest_framework.response import Response
from rest_framework.views import APIView


class EventStreamRenderer(BaseRenderer):
    """Renderer that accepts text/event-stream for SSE endpoints."""
    media_type = "text/event-stream"
    format = "text"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data

from apps.core.pagination import FeedCursorPagination

from .models import Notification, NotificationPreference
from .serializers import (
    MarkReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)
from .services import generate_digest_content, get_unread_count


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — Notification feed with unread count."""

    serializer_class = NotificationSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related("actor").order_by("-created_at")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Add unread count to response
        unread_count = get_unread_count(request.user)
        if isinstance(response.data, dict):
            response.data.setdefault("meta", {})["unread_count"] = unread_count
        return response


class MarkReadView(APIView):
    """POST /api/notifications/mark-read/ — Mark notifications as read."""

    def post(self, request):
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("all"):
            Notification.objects.filter(
                recipient=request.user, is_read=False
            ).update(is_read=True)
        elif serializer.validated_data.get("notification_ids"):
            Notification.objects.filter(
                recipient=request.user,
                id__in=serializer.validated_data["notification_ids"],
            ).update(is_read=True)

        return Response(status=status.HTTP_204_NO_CONTENT)


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ — Polling fallback for unread count."""

    def get(self, request):
        count = get_unread_count(request.user)
        return Response({"unread_count": count})


class BadgeStreamView(APIView):
    """GET /api/notifications/stream/ — SSE endpoint for real-time notifications."""
    renderer_classes = [EventStreamRenderer]

    def get(self, request):
        def event_stream():
            last_count = get_unread_count(request.user)
            last_notification_id = None

            # Initial event
            yield f"data: {json.dumps({'type': 'connected', 'unread_count': last_count})}\n\n"

            # Keep connection alive and check for updates
            while True:
                time.sleep(5)  # Check every 5 seconds

                current_count = get_unread_count(request.user)

                # Get latest notification
                latest = Notification.objects.filter(
                    recipient=request.user
                ).order_by("-created_at").first()

                latest_id = str(latest.id) if latest else None

                if current_count != last_count or latest_id != last_notification_id:
                    # Send update
                    event_data = {
                        "type": "update",
                        "unread_count": current_count,
                    }

                    if latest_id != last_notification_id and latest:
                        event_data["latest"] = {
                            "id": str(latest.id),
                            "type": latest.notification_type,
                            "text": latest.text,
                        }

                    yield f"data: {json.dumps(event_data)}\n\n"

                    last_count = current_count
                    last_notification_id = latest_id
                else:
                    # Heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class NotificationPreferenceView(APIView):
    """GET/PUT /api/notifications/preferences/ — User notification preferences."""

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data)

    def put(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DigestPreviewView(APIView):
    """GET /api/notifications/digest-preview/ — Preview digest content."""

    def get(self, request):
        content = generate_digest_content(request.user)
        return Response(content)

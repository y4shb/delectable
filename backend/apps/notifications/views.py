from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import FeedCursorPagination

from .models import Notification
from .serializers import MarkReadSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — Notification feed with unread count."""

    serializer_class = NotificationSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Add unread count to response
        unread_count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
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

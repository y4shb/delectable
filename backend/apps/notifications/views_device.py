"""Views for device token registration and removal."""

import logging

from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models_device import DeviceToken

logger = logging.getLogger(__name__)


class DeviceTokenSerializer(serializers.Serializer):
    """Validates incoming device token registration requests."""

    token = serializers.CharField(max_length=4096)
    platform = serializers.ChoiceField(
        choices=DeviceToken.PLATFORM_CHOICES,
        default="web",
    )


class RegisterDeviceView(APIView):
    """POST /api/notifications/devices/register/ -- Register or update a device token.

    If the token already exists for a different user, it is reassigned to the
    current user (a token belongs to exactly one device, and a device is used
    by one person at a time).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_value = serializer.validated_data["token"]
        platform = serializer.validated_data["platform"]

        # Upsert: update existing token or create new one
        device_token, created = DeviceToken.objects.update_or_create(
            token=token_value,
            defaults={
                "user": request.user,
                "platform": platform,
                "is_active": True,
            },
        )

        action = "registered" if created else "updated"
        logger.info(
            "Device token %s for user %s (%s)",
            action,
            request.user.id,
            platform,
        )

        return Response(
            {
                "id": str(device_token.id),
                "token": device_token.token[:20] + "...",
                "platform": device_token.platform,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class UnregisterDeviceView(APIView):
    """DELETE /api/notifications/devices/unregister/ -- Remove a device token.

    Accepts the token in the request body. Only tokens belonging to the
    authenticated user can be removed.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        token_value = request.data.get("token")
        if not token_value:
            return Response(
                {"detail": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted_count, _ = DeviceToken.objects.filter(
            token=token_value,
            user=request.user,
        ).delete()

        if deleted_count == 0:
            return Response(
                {"detail": "Token not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        logger.info("Device token unregistered for user %s", request.user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)

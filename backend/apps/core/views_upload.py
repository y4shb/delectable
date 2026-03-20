"""Presigned URL upload endpoint for direct-to-S3 browser uploads."""

import os

from django.conf import settings
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .storage import generate_presigned_upload_url


class PresignedUploadSerializer(serializers.Serializer):
    """Validate the presigned upload request body."""

    file_name = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)
    folder = serializers.CharField(max_length=100, default="uploads")

    def validate_content_type(self, value):
        allowed = settings.UPLOAD_ALLOWED_CONTENT_TYPES
        if value not in allowed:
            raise serializers.ValidationError(
                f"Content type '{value}' is not allowed. "
                f"Allowed types: {', '.join(sorted(allowed))}"
            )
        return value

    def validate_file_name(self, value):
        # Sanitize: strip directory components to prevent traversal
        value = os.path.basename(value)
        if not value:
            raise serializers.ValidationError("Invalid file name.")

        _, ext = os.path.splitext(value)
        ext = ext.lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"File extension '{ext}' is not allowed. "
                f"Allowed: {', '.join(sorted(allowed_extensions))}"
            )
        return value

    def validate_folder(self, value):
        # Only allow alphanumeric, hyphens, underscores, and slashes
        sanitized = value.strip("/")
        for char in sanitized:
            if not (char.isalnum() or char in "-_/"):
                raise serializers.ValidationError(
                    "Folder name contains invalid characters."
                )
        # Prevent directory traversal
        if ".." in sanitized:
            raise serializers.ValidationError("Invalid folder path.")
        return sanitized


class PresignedUploadView(APIView):
    """
    POST /api/upload/presigned/

    Request a presigned S3 POST URL for direct browser upload.

    Request body:
        {
            "fileName": "photo.jpg",
            "contentType": "image/jpeg",
            "folder": "reviews"       // optional, defaults to "uploads"
        }

    Response:
        {
            "uploadUrl": "https://s3.amazonaws.com/...",
            "fields": { ... },        // form fields for multipart POST
            "fileUrl": "https://cdn.example.com/reviews/abc123_1710000000.jpg"
        }
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "uploads"

    def post(self, request):
        if not settings.AWS_ACCESS_KEY_ID:
            return Response(
                {
                    "error": {
                        "code": "NOT_CONFIGURED",
                        "message": "S3 storage is not configured. "
                        "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
                        "status": 503,
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = PresignedUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        result = generate_presigned_upload_url(
            file_name=data["file_name"],
            content_type=data["content_type"],
            folder=data["folder"],
        )

        return Response(
            {
                "uploadUrl": result["uploadUrl"],
                "fields": result["fields"],
                "fileUrl": result["fileUrl"],
            },
            status=status.HTTP_200_OK,
        )

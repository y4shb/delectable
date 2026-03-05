"""Core views including file uploads and health checks."""

import os
import uuid
from django.conf import settings
from django.db import connection
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """GET /api/health/ — Health check for load balancers and monitoring."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Skip auth for health checks

    def get(self, request):
        """
        Returns minimal health status.
        Does NOT expose version info, debug status, or internal details.
        """
        health = {"status": "healthy"}

        # Optional: Check database connectivity
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            health["status"] = "unhealthy"
            health["database"] = "unavailable"
            return Response(health, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(health)


class FileUploadView(APIView):
    """POST /api/uploads/ — Upload a file and return its URL."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]
    throttle_scope = "uploads"

    # Allowed image extensions
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    # Max file size: 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "No file provided.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size
        if file.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "File too large. Max 10MB.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file extension
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid file type. Allowed: jpg, jpeg, png, gif, webp.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', str(request.user.id))
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        with open(file_path, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        # Build URL
        relative_path = f"uploads/{request.user.id}/{unique_filename}"
        url = f"{settings.MEDIA_URL}{relative_path}"

        return Response(
            {"url": url},
            status=status.HTTP_201_CREATED,
        )

"""Core app URL configuration."""

from django.urls import path

from .views import FileUploadView, HealthCheckView
from .views_upload import PresignedUploadView

urlpatterns = [
    path("uploads/", FileUploadView.as_view(), name="file-upload"),
    path("upload/presigned/", PresignedUploadView.as_view(), name="presigned-upload"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
]

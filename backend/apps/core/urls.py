"""Core app URL configuration."""

from django.urls import path

from .views import FileUploadView

urlpatterns = [
    path("uploads/", FileUploadView.as_view(), name="file-upload"),
]

from django.urls import path

from . import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path("notifications/mark-read/", views.MarkReadView.as_view(), name="mark-read"),
]

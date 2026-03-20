from django.urls import path

from . import views
from .views_device import RegisterDeviceView, UnregisterDeviceView

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path("notifications/mark-read/", views.MarkReadView.as_view(), name="mark-read"),
    path("notifications/unread-count/", views.UnreadCountView.as_view(), name="unread-count"),
    path("notifications/stream/", views.BadgeStreamView.as_view(), name="notification-stream"),
    path("notifications/preferences/", views.NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("notifications/digest-preview/", views.DigestPreviewView.as_view(), name="digest-preview"),
    path("notifications/devices/register/", RegisterDeviceView.as_view(), name="device-register"),
    path("notifications/devices/unregister/", UnregisterDeviceView.as_view(), name="device-unregister"),
]

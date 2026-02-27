from django.urls import path

from . import views

urlpatterns = [
    path("venues/", views.VenueViewSet.as_view({"get": "list"}), name="venue-list"),
    path("venues/<uuid:id>/", views.VenueViewSet.as_view({"get": "retrieve"}), name="venue-detail"),
]

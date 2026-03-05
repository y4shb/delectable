from django.urls import path

from . import views
from .views_dishes import DishDetailView, DishListView
from .views_dietary import DietaryReportView
from .views_friends import FriendsVenuesView
from .views_nearby import NearbySavedVenuesView
from .views_occasions import OccasionVoteView
from .views_similar import SimilarVenuesView

urlpatterns = [
    path("venues/", views.VenueViewSet.as_view({"get": "list"}), name="venue-list"),
    path("venues/friends/", FriendsVenuesView.as_view(), name="venue-friends"),
    path("venues/nearby-saved/", NearbySavedVenuesView.as_view(), name="nearby-saved"),
    path("venues/<uuid:id>/", views.VenueViewSet.as_view({"get": "retrieve"}), name="venue-detail"),
    path("venues/<uuid:id>/occasions/<slug:slug>/vote/", OccasionVoteView.as_view(), name="occasion-vote"),
    path("venues/<uuid:id>/dietary/", DietaryReportView.as_view(), name="dietary-report"),
    path("venues/<uuid:id>/similar/", SimilarVenuesView.as_view(), name="similar-venues"),
    path("dishes/", DishListView.as_view(), name="dish-list"),
    path("dishes/<uuid:id>/", DishDetailView.as_view(), name="dish-detail"),
]

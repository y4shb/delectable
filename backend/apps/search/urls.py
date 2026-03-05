from django.urls import path

from . import views
from apps.venues.views_occasions import OccasionTagListView

urlpatterns = [
    path("search/", views.SearchView.as_view(), name="search"),
    path("search/autocomplete/", views.AutocompleteView.as_view(), name="autocomplete"),
    path("occasions/", OccasionTagListView.as_view(), name="occasion-list"),
]

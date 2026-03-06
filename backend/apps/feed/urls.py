from django.urls import path

from . import views

urlpatterns = [
    path("feed/", views.FeedView.as_view(), name="feed"),
    path("feed/trending/", views.TrendingView.as_view(), name="trending"),
    path("feed/taste-profile/", views.TasteProfileView.as_view(), name="taste-profile"),
    path("feed/tier/", views.FeedTierView.as_view(), name="feed-tier"),
    path("feed/discover/", views.DecisionEngineView.as_view(), name="discover"),
    path("feed/weather-recs/", views.WeatherRecommendationsView.as_view(), name="weather-recs"),
]

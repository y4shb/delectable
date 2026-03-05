from django.urls import path

from . import views

urlpatterns = [
    # Recommendations
    path("recommendations/", views.RecommendationsView.as_view(), name="ml-recommendations"),

    # ML-scored feed
    path("feed/", views.MLScoredFeedView.as_view(), name="ml-feed"),

    # Authenticity
    path("reviews/<uuid:id>/authenticity/", views.ReviewAuthenticityView.as_view(), name="review-authenticity"),
    path("reviews/<uuid:id>/trusted-badge/", views.TrustedBadgeView.as_view(), name="trusted-badge"),

    # Trending
    path("trending/", views.TrendingView.as_view(), name="trending"),
    path("trending/refresh/", views.RefreshTrendingView.as_view(), name="refresh-trending"),

    # Data ingestion
    path("ingest/", views.IngestVenuesView.as_view(), name="ingest-venues"),
    path("data-quality/", views.DataQualityView.as_view(), name="data-quality"),
]

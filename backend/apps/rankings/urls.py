from django.urls import path

from . import views

urlpatterns = [
    path("comparisons/", views.ComparisonView.as_view(), name="comparison-create"),
    path("", views.PersonalRankingView.as_view(), name="personal-rankings"),
    path("next/", views.NextComparisonView.as_view(), name="next-comparison"),
]

from django.urls import path

from . import views

urlpatterns = [
    path("xp/", views.XPProfileView.as_view(), name="xp-profile"),
    path("xp/history/", views.XPHistoryView.as_view(), name="xp-history"),
    path("streak/", views.StreakView.as_view(), name="streak"),
    path("activity-grid/", views.ActivityGridView.as_view(), name="activity-grid"),
    path("badges/", views.BadgeListView.as_view(), name="badges"),
    path("my-badges/", views.UserBadgesView.as_view(), name="my-badges"),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),
    path("leaderboard/friends/", views.FriendsLeaderboardView.as_view(), name="friends-leaderboard"),
    path("wrapped/", views.WrappedView.as_view(), name="wrapped"),
    path("stats/", views.UserStatsView.as_view(), name="stats"),
]

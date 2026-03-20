from django.urls import path

from . import views
from .views_account import (
    DeleteAccountView,
    ExportDataView,
    ForgotPasswordView,
    ResetPasswordView,
)
from apps.reviews.views import UserReviewsView

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("me/delete/", DeleteAccountView.as_view(), name="delete-account"),
    path("me/export/", ExportDataView.as_view(), name="export-data"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("suggested-users/", views.SuggestedUsersView.as_view(), name="suggested-users"),
    path("users/<uuid:id>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<uuid:id>/follow/", views.FollowView.as_view(), name="follow"),
    path("users/<uuid:id>/followers/", views.FollowerListView.as_view(), name="followers"),
    path("users/<uuid:id>/following/", views.FollowingListView.as_view(), name="following"),
    path("users/<uuid:id>/reviews/", UserReviewsView.as_view(), name="user-reviews"),
    path("users/<uuid:id>/playlists/", views.UserPlaylistsView.as_view(), name="user-playlists"),
    path("users/<uuid:id>/taste-match/", views.TasteMatchView.as_view(), name="taste-match"),
]

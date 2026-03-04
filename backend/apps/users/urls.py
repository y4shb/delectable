from django.urls import path

from . import views
from apps.reviews.views import UserReviewsView

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("users/<uuid:id>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<uuid:id>/follow/", views.FollowView.as_view(), name="follow"),
    path("users/<uuid:id>/followers/", views.FollowerListView.as_view(), name="followers"),
    path("users/<uuid:id>/following/", views.FollowingListView.as_view(), name="following"),
    path("users/<uuid:id>/reviews/", UserReviewsView.as_view(), name="user-reviews"),
]

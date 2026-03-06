from django.urls import path

from apps.venues.views_responses import VenueResponseView

from . import views

urlpatterns = [
    path("reviews/", views.ReviewViewSet.as_view({"post": "create"}), name="review-create"),
    path("reviews/quick/", views.QuickReviewView.as_view(), name="quick-review"),
    path("reviews/<uuid:id>/", views.ReviewViewSet.as_view({
        "get": "retrieve", "patch": "partial_update", "delete": "destroy"
    }), name="review-detail"),
    path("reviews/<uuid:id>/like/", views.LikeView.as_view(), name="review-like"),
    path("reviews/<uuid:id>/bookmark/", views.BookmarkView.as_view(), name="review-bookmark"),
    path("reviews/<uuid:id>/response/", VenueResponseView.as_view(), name="review-venue-response"),
    path("reviews/<uuid:id>/comments/", views.CommentListCreateView.as_view(), name="review-comments"),
    path("reviews/<uuid:rid>/comments/<uuid:cid>/", views.CommentDeleteView.as_view(), name="comment-delete"),
    path("venues/<uuid:id>/reviews/", views.VenueReviewsView.as_view(), name="venue-reviews"),
    path("bookmarks/", views.BookmarkListView.as_view(), name="bookmarks"),
    path("want-to-try/", views.WantToTryListView.as_view(), name="want-to-try-list"),
    path("want-to-try/<uuid:pk>/", views.WantToTryDetailView.as_view(), name="want-to-try-detail"),
]

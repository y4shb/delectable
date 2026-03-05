from django.urls import path

from . import views

urlpatterns = [
    path("playlists/", views.PlaylistViewSet.as_view({"get": "list", "post": "create"}), name="playlist-list"),
    path("playlists/<uuid:id>/", views.PlaylistViewSet.as_view({
        "get": "retrieve", "patch": "partial_update", "delete": "destroy"
    }), name="playlist-detail"),
    path("playlists/<uuid:id>/items/", views.PlaylistItemCreateView.as_view(), name="playlist-item-create"),
    path("playlists/<uuid:pid>/items/<uuid:iid>/", views.PlaylistItemDeleteView.as_view(), name="playlist-item-delete"),
    path("playlists/<uuid:id>/items/reorder/", views.PlaylistReorderView.as_view(), name="playlist-reorder"),
]

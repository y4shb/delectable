from django.db import models as db_models
from django.db.models.functions import Greatest
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import CanViewPlaylist, IsOwner
from apps.users.models import Follow

from .models import Playlist, PlaylistItem, PlaylistVisibility, SavedPlaylist
from .serializers import (
    PlaylistItemSerializer,
    PlaylistListSerializer,
    PlaylistSerializer,
    ReorderSerializer,
    SavedPlaylistSerializer,
)


class PlaylistViewSet(viewsets.ModelViewSet):
    """
    CRUD for playlists.
    GET /api/playlists/       — List (optional ?user_id= filter)
    POST /api/playlists/      — Create
    GET /api/playlists/{id}/  — Detail with items
    PATCH /api/playlists/{id}/ — Update metadata
    DELETE /api/playlists/{id}/ — Delete
    """

    lookup_field = "id"

    def get_queryset(self):
        qs = Playlist.objects.select_related("user", "forked_from__user").all()
        user_id = self.request.query_params.get("user_id")

        if self.action == "list":
            if user_id:
                qs = qs.filter(user_id=user_id)
                # Filter by visibility for non-owners
                if str(user_id) != str(getattr(self.request.user, 'id', None)):
                    qs = self._filter_by_visibility(qs, user_id)
            else:
                # Default: show current user's playlists
                qs = qs.filter(user=self.request.user)
        elif self.action == "retrieve":
            # Visibility check handled by permission class
            pass

        return qs

    def _filter_by_visibility(self, qs, owner_id):
        """Filter playlists based on visibility and viewer relationship."""
        user = self.request.user

        if not user or not user.is_authenticated:
            # Anonymous users only see public
            return qs.filter(visibility=PlaylistVisibility.PUBLIC)

        # Check if viewer follows the owner
        is_following = Follow.objects.filter(
            follower=user, following_id=owner_id
        ).exists()

        if is_following:
            # Followers see public + followers-only
            return qs.filter(
                visibility__in=[PlaylistVisibility.PUBLIC, PlaylistVisibility.FOLLOWERS]
            )
        else:
            # Non-followers only see public
            return qs.filter(visibility=PlaylistVisibility.PUBLIC)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PlaylistSerializer
        return PlaylistListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_permissions(self):
        if self.action == "retrieve":
            return [permissions.IsAuthenticated(), CanViewPlaylist()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PlaylistItemCreateView(APIView):
    """POST /api/playlists/{id}/items/ — Add venue to playlist."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        playlist = generics.get_object_or_404(Playlist, id=id, user=request.user)
        serializer = PlaylistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set sort_order to end of list
        max_order = PlaylistItem.objects.filter(playlist=playlist).aggregate(
            max_order=db_models.Max("sort_order")
        )["max_order"] or 0

        item = PlaylistItem.objects.create(
            playlist=playlist,
            venue_id=serializer.validated_data["venue"].id,
            caption=serializer.validated_data.get("caption", ""),
            sort_order=max_order + 1,
        )

        Playlist.objects.filter(id=id).update(
            items_count=db_models.F("items_count") + 1
        )

        return Response(
            PlaylistItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class PlaylistItemDeleteView(APIView):
    """DELETE /api/playlists/{pid}/items/{iid}/ — Remove item."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pid, iid):
        item = generics.get_object_or_404(
            PlaylistItem, id=iid, playlist_id=pid, playlist__user=request.user
        )
        item.delete()
        Playlist.objects.filter(id=pid).update(
            items_count=Greatest(db_models.F("items_count") - 1, 0)
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistReorderView(APIView):
    """PATCH /api/playlists/{id}/items/reorder/ — Reorder items."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        playlist = generics.get_object_or_404(Playlist, id=id, user=request.user)
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_ids = serializer.validated_data["item_ids"]
        items = PlaylistItem.objects.filter(playlist=playlist)
        existing_ids = set(str(i.id) for i in items)
        requested_ids = set(str(i) for i in item_ids)

        if existing_ids != requested_ids:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "All current item IDs must be included.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.db import transaction
        with transaction.atomic():
            for order, item_id in enumerate(item_ids):
                PlaylistItem.objects.filter(id=item_id, playlist=playlist).update(
                    sort_order=order
                )

        return Response(
            PlaylistSerializer(playlist, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )


class SavePlaylistView(APIView):
    """POST /api/playlists/{id}/save/ — Save (bookmark) a playlist to library."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "playlist_actions"

    def post(self, request, id):
        playlist = generics.get_object_or_404(Playlist, id=id)

        # Can't save your own playlist
        if playlist.user == request.user:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Cannot save your own playlist.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check visibility permission
        if not self._can_view_playlist(request.user, playlist):
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You don't have permission to view this playlist.", "status": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create or get saved playlist
        saved, created = SavedPlaylist.objects.get_or_create(
            user=request.user,
            playlist=playlist,
        )

        if created:
            Playlist.objects.filter(id=id).update(
                save_count=db_models.F("save_count") + 1
            )

        return Response(
            {"saved": True, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, id):
        """DELETE /api/playlists/{id}/save/ — Unsave a playlist."""
        playlist = generics.get_object_or_404(Playlist, id=id)

        deleted, _ = SavedPlaylist.objects.filter(
            user=request.user, playlist=playlist
        ).delete()

        if deleted:
            Playlist.objects.filter(id=id).update(
                save_count=Greatest(db_models.F("save_count") - 1, 0)
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _can_view_playlist(self, user, playlist):
        """Check if user can view this playlist."""
        if playlist.visibility == PlaylistVisibility.PUBLIC:
            return True
        if playlist.visibility == PlaylistVisibility.FOLLOWERS:
            return Follow.objects.filter(follower=user, following=playlist.user).exists()
        return False


class ForkPlaylistView(APIView):
    """POST /api/playlists/{id}/fork/ — Fork (copy) a playlist."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "playlist_actions"

    def post(self, request, id):
        original = generics.get_object_or_404(Playlist, id=id)

        # Check visibility permission
        if original.user != request.user and not self._can_view_playlist(request.user, original):
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You don't have permission to fork this playlist.", "status": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create forked playlist
        forked = Playlist.objects.create(
            user=request.user,
            title=f"{original.title} (Fork)",
            description=original.description,
            visibility=PlaylistVisibility.PRIVATE,  # Forks start as private
            forked_from=original,
        )

        # Copy all items
        items_to_create = []
        for item in original.items.all():
            items_to_create.append(
                PlaylistItem(
                    playlist=forked,
                    venue=item.venue,
                    caption=item.caption,
                    sort_order=item.sort_order,
                )
            )

        if items_to_create:
            PlaylistItem.objects.bulk_create(items_to_create)
            forked.items_count = len(items_to_create)
            forked.save(update_fields=["items_count"])

        # Increment fork count on original
        Playlist.objects.filter(id=id).update(
            fork_count=db_models.F("fork_count") + 1
        )

        return Response(
            PlaylistSerializer(forked, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def _can_view_playlist(self, user, playlist):
        """Check if user can view this playlist."""
        if playlist.visibility == PlaylistVisibility.PUBLIC:
            return True
        if playlist.visibility == PlaylistVisibility.FOLLOWERS:
            return Follow.objects.filter(follower=user, following=playlist.user).exists()
        return False


class SavedPlaylistsView(generics.ListAPIView):
    """GET /api/playlists/saved/ — List playlists saved by current user."""

    serializer_class = SavedPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedPlaylist.objects.filter(
            user=self.request.user
        ).select_related("playlist__user")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

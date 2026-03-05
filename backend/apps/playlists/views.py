from django.db import models as db_models
from django.db.models.functions import Greatest
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsOwner, IsOwnerOrReadOnly

from .models import Playlist, PlaylistItem
from .serializers import (
    PlaylistItemSerializer,
    PlaylistListSerializer,
    PlaylistSerializer,
    ReorderSerializer,
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
        qs = Playlist.objects.select_related("user").all()
        user_id = self.request.query_params.get("user_id")
        if self.action == "list":
            if user_id:
                qs = qs.filter(user_id=user_id)
                if str(user_id) != str(self.request.user.id):
                    qs = qs.filter(is_public=True)
            else:
                qs = qs.filter(user=self.request.user)
        elif self.action == "retrieve":
            # Allow owner to see their own private playlists
            qs = qs.filter(
                db_models.Q(is_public=True) | db_models.Q(user=self.request.user)
            )
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PlaylistSerializer
        return PlaylistListSerializer

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PlaylistItemCreateView(APIView):
    """POST /api/playlists/{id}/items/ — Add venue to playlist."""

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

        for order, item_id in enumerate(item_ids):
            PlaylistItem.objects.filter(id=item_id, playlist=playlist).update(
                sort_order=order
            )

        return Response(
            PlaylistSerializer(playlist).data,
            status=status.HTTP_200_OK,
        )

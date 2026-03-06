from django.db.models import F
from rest_framework import generics, permissions

from .models import KitchenStory
from .serializers import KitchenStoryDetailSerializer, KitchenStoryListSerializer


class KitchenStoryListView(generics.ListAPIView):
    """
    GET /api/venues/kitchen-stories/

    List published kitchen stories, optionally filtered by venue or story_type.
    """

    serializer_class = KitchenStoryListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = KitchenStory.objects.filter(is_published=True).select_related("venue")
        params = self.request.query_params

        venue = params.get("venue")
        if venue:
            qs = qs.filter(venue_id=venue)

        story_type = params.get("story_type")
        if story_type:
            qs = qs.filter(story_type=story_type)

        return qs[:50]


class KitchenStoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/venues/kitchen-stories/<id>/

    Get full kitchen story detail. Increments view_count atomically.
    """

    serializer_class = KitchenStoryDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_queryset(self):
        return KitchenStory.objects.filter(is_published=True).select_related("venue")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        KitchenStory.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.view_count += 1  # Update in-memory for response
        serializer = self.get_serializer(instance)
        from rest_framework.response import Response
        return Response(serializer.data)

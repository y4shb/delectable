from django.db.models import F
from rest_framework import generics, permissions

from .models import FoodGuide
from .serializers import FoodGuideDetailSerializer, FoodGuideListSerializer


class FoodGuideListView(generics.ListAPIView):
    """
    GET /api/venues/guides/

    List published food guides, optionally filtered by city.
    """

    serializer_class = FoodGuideListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = FoodGuide.objects.filter(is_published=True).prefetch_related("stops")
        params = self.request.query_params

        city = params.get("city")
        if city:
            qs = qs.filter(city__icontains=city)

        return qs[:50]


class FoodGuideDetailView(generics.RetrieveAPIView):
    """
    GET /api/venues/guides/<id>/

    Get full food guide detail with stops. Increments view_count.
    """

    serializer_class = FoodGuideDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_queryset(self):
        return FoodGuide.objects.filter(is_published=True).prefetch_related(
            "stops__venue"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        FoodGuide.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.view_count += 1
        serializer = self.get_serializer(instance)
        from rest_framework.response import Response
        return Response(serializer.data)

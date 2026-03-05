from django.db.models import Q
from rest_framework import generics, permissions

from .models import Dish
from .serializers import DishDetailSerializer, DishListSerializer


class DishListView(generics.ListAPIView):
    """GET /api/dishes/?venue=<uuid>&q=<text>"""

    serializer_class = DishListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Dish.objects.all()
        params = self.request.query_params

        venue = params.get("venue")
        if venue:
            qs = qs.filter(venue_id=venue)

        q = params.get("q", "").strip()
        if q:
            qs = qs.filter(name__icontains=q)

        return qs.order_by("-review_count")[:50]


class DishDetailView(generics.RetrieveAPIView):
    """GET /api/dishes/<uuid>/"""

    queryset = Dish.objects.select_related("venue").all()
    serializer_class = DishDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

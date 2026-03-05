from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DietaryReport
from .serializers import DietaryReportCreateSerializer


class DietaryReportView(APIView):
    """POST /api/venues/<id>/dietary/ — Report dietary info for a venue."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        serializer = DietaryReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        DietaryReport.objects.update_or_create(
            user=request.user,
            venue_id=id,
            category=serializer.validated_data["category"],
            scope=serializer.validated_data.get("scope", "venue"),
            defaults={
                "is_available": serializer.validated_data["is_available"],
                "dish": serializer.validated_data.get("dish"),
            },
        )
        return Response({"data": "ok"}, status=status.HTTP_201_CREATED)

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.venues.models import Venue

from .elo import (
    compute_confidence,
    get_comparison_pair,
    recalculate_ranks,
    update_ratings,
)
from .models import PairwiseComparison, PersonalRanking
from .serializers import (
    NextComparisonSerializer,
    PairwiseComparisonCreateSerializer,
    PairwiseComparisonSerializer,
    PersonalRankingSerializer,
)


class ComparisonView(APIView):
    """
    POST /api/rankings/comparisons/

    Submit a pairwise comparison between two venues.
    Updates Elo scores and recalculates ranks.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PairwiseComparisonCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        venue_a_id = data["venue_a"]
        venue_b_id = data["venue_b"]
        winner_id = data.get("winner")

        # Validate venues exist
        try:
            venue_a = Venue.objects.get(id=venue_a_id)
            venue_b = Venue.objects.get(id=venue_b_id)
        except Venue.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Venue not found.", "status": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            # Check for existing comparison (update if exists)
            comparison, created = PairwiseComparison.objects.update_or_create(
                user=request.user,
                venue_a=venue_a,
                venue_b=venue_b,
                defaults={"winner_id": winner_id},
            )

            # Get or create personal rankings for both venues
            ranking_a, _ = PersonalRanking.objects.get_or_create(
                user=request.user,
                venue=venue_a,
            )
            ranking_b, _ = PersonalRanking.objects.get_or_create(
                user=request.user,
                venue=venue_b,
            )

            # Only apply Elo update for new comparisons to avoid
            # double-counting when re-comparing the same pair
            if created:
                # Determine the outcome
                if winner_id is None:
                    outcome = "draw"
                elif winner_id == venue_a.id:
                    outcome = "a"
                else:
                    outcome = "b"

                # Update Elo ratings
                new_elo_a, new_elo_b = update_ratings(
                    ranking_a.elo_score,
                    ranking_b.elo_score,
                    outcome,
                    count_a=ranking_a.comparison_count,
                    count_b=ranking_b.comparison_count,
                )

                # Update ranking records
                ranking_a.elo_score = new_elo_a
                ranking_a.comparison_count += 1
                ranking_a.confidence = compute_confidence(ranking_a.comparison_count)
                ranking_a.save(update_fields=["elo_score", "comparison_count", "confidence", "updated_at"])

                ranking_b.elo_score = new_elo_b
                ranking_b.comparison_count += 1
                ranking_b.confidence = compute_confidence(ranking_b.comparison_count)
                ranking_b.save(update_fields=["elo_score", "comparison_count", "confidence", "updated_at"])

            # Recalculate all ranks for this user
            recalculate_ranks(request.user)

        # Reload comparison with select_related to avoid N+1 queries
        comparison = PairwiseComparison.objects.select_related(
            "venue_a", "venue_b", "winner"
        ).get(pk=comparison.pk)
        comparison_data = PairwiseComparisonSerializer(comparison).data
        updated_rankings = PersonalRankingSerializer(
            PersonalRanking.objects.filter(
                user=request.user, venue_id__in=[venue_a_id, venue_b_id]
            ).select_related("venue"),
            many=True,
        ).data

        return Response(
            {
                "data": {
                    "comparison": comparison_data,
                    "updated_rankings": updated_rankings,
                }
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class PersonalRankingView(generics.ListAPIView):
    """
    GET /api/rankings/

    Get the authenticated user's personal rankings.
    Query params:
        - limit: number of results (default 10, max 100)
        - full: if 'true', return all rankings
    """

    serializer_class = PersonalRankingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PersonalRanking.objects.filter(user=self.request.user)
            .select_related("venue")
            .order_by("rank")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        full = request.query_params.get("full", "").lower() == "true"

        if not full:
            try:
                limit = min(int(request.query_params.get("limit", 10)), 100)
            except (ValueError, TypeError):
                limit = 10
            queryset = queryset[:limit]

        serializer = self.get_serializer(queryset, many=True)
        total_count = PersonalRanking.objects.filter(user=request.user).count()
        total_comparisons = (
            PairwiseComparison.objects.filter(user=request.user).count()
        )

        return Response(
            {
                "data": serializer.data,
                "meta": {
                    "total_venues": total_count,
                    "total_comparisons": total_comparisons,
                },
            }
        )


class NextComparisonView(APIView):
    """
    GET /api/rankings/next/

    Get the next pair of venues for the user to compare.
    Query params:
        - venue_id: Optional UUID of a specific venue to include in the comparison.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        venue_id = request.query_params.get("venue_id")
        new_venue = None

        if venue_id:
            try:
                new_venue = Venue.objects.get(id=venue_id)
            except Venue.DoesNotExist:
                return Response(
                    {"error": {"code": "NOT_FOUND", "message": "Venue not found.", "status": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )

        pair = get_comparison_pair(request.user, new_venue=new_venue)

        if pair is None:
            return Response(
                {
                    "error": {
                        "code": "INSUFFICIENT_DATA",
                        "message": "You need to review at least 2 venues before comparing.",
                        "status": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        venue_a, venue_b = pair
        data = NextComparisonSerializer(
            {"venue_a": venue_a, "venue_b": venue_b}
        ).data

        return Response({"data": data})

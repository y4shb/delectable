"""
Timeline and Dish Comparison views.

Endpoints:
  GET /api/venues/{id}/timeline/       — Venue rating trend over time
  GET /api/venues/{id}/user-timeline/  — Authenticated user's reviews at venue
  GET /api/dishes/{id}/timeline/       — Dish rating trend over time
  GET /api/dishes/compare/             — Side-by-side dish comparison
"""

from collections import Counter
from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Max, Min
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review

from .models import Dish, Venue, VenueRatingSnapshot
from .serializers import (
    DishCompareSerializer,
    VenueTimelineSerializer,
    VenueUserTimelineSerializer,
)


def _compute_trend(snapshots):
    """
    Compute a simple linear regression slope on avg_rating values.

    Returns (trend_label, slope):
      slope >  0.1 -> "improving"
      slope < -0.1 -> "declining"
      else         -> "stable"
    """
    if len(snapshots) < 2:
        return "stable", 0.0

    n = len(snapshots)
    x_vals = list(range(n))
    y_vals = [float(s["avg_rating"]) for s in snapshots]

    x_mean = sum(x_vals) / n
    y_mean = sum(y_vals) / n

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
    denominator = sum((x - x_mean) ** 2 for x in x_vals)

    if denominator == 0:
        return "stable", 0.0

    slope = numerator / denominator

    if slope > 0.1:
        return "improving", round(slope, 4)
    elif slope < -0.1:
        return "declining", round(slope, 4)
    return "stable", round(slope, 4)


def _build_snapshots_from_reviews(review_qs, period):
    """
    Aggregate reviews into period-based snapshots.
    Returns a list of dicts with the snapshot shape.
    period_start is converted from datetime to date for serialization.
    """
    trunc_fn = TruncWeek if period == "week" else TruncMonth

    rows = list(
        review_qs
        .annotate(period_start=trunc_fn("created_at"))
        .values("period_start")
        .annotate(
            avg_rating=Avg("rating"),
            review_count=Count("id"),
            min_rating=Min("rating"),
            max_rating=Max("rating"),
        )
        .order_by("period_start")
    )

    # TruncMonth/TruncWeek returns datetime; convert to date for the serializer
    for row in rows:
        if hasattr(row["period_start"], "date"):
            row["period_start"] = row["period_start"].date()

    return rows


class VenueTimelineView(APIView):
    """GET /api/venues/{id}/timeline/ -- venue rating trend over time."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        try:
            venue = Venue.objects.get(pk=id)
        except Venue.DoesNotExist:
            return Response(
                {"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND
            )

        period = request.query_params.get("period", "month")
        if period not in ("week", "month"):
            period = "month"

        try:
            months = int(request.query_params.get("months", 12))
        except (ValueError, TypeError):
            months = 12

        since = timezone.now() - timedelta(days=months * 30)

        reviews = Review.objects.filter(venue=venue, created_at__gte=since)
        snapshots = _build_snapshots_from_reviews(reviews, period)

        trend, trend_score = _compute_trend(snapshots)

        first_review = (
            Review.objects.filter(venue=venue)
            .order_by("created_at")
            .values_list("created_at", flat=True)
            .first()
        )

        data = {
            "venue_obj": venue,
            "trend": trend,
            "trend_score": trend_score,
            "snapshots": snapshots,
            "total_reviews": Review.objects.filter(venue=venue).count(),
            "first_review_date": first_review,
        }

        serializer = VenueTimelineSerializer(data)
        return Response(serializer.data)


class DishTimelineView(APIView):
    """GET /api/dishes/{id}/timeline/ -- dish rating trend over time."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        try:
            dish = Dish.objects.select_related("venue").get(pk=id)
        except Dish.DoesNotExist:
            return Response(
                {"detail": "Dish not found."}, status=status.HTTP_404_NOT_FOUND
            )

        period = request.query_params.get("period", "month")
        if period not in ("week", "month"):
            period = "month"

        try:
            months = int(request.query_params.get("months", 12))
        except (ValueError, TypeError):
            months = 12

        since = timezone.now() - timedelta(days=months * 30)

        reviews = Review.objects.filter(dish=dish, created_at__gte=since)
        snapshots = _build_snapshots_from_reviews(reviews, period)

        trend, trend_score = _compute_trend(snapshots)

        first_review = (
            Review.objects.filter(dish=dish)
            .order_by("created_at")
            .values_list("created_at", flat=True)
            .first()
        )

        data = {
            "venue_obj": dish.venue,
            "trend": trend,
            "trend_score": trend_score,
            "snapshots": snapshots,
            "total_reviews": Review.objects.filter(dish=dish).count(),
            "first_review_date": first_review,
        }

        serializer = VenueTimelineSerializer(data)
        return Response(serializer.data)


class VenueUserTimelineView(APIView):
    """GET /api/venues/{id}/user-timeline/ -- user's personal reviews at venue."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            venue = Venue.objects.get(pk=id)
        except Venue.DoesNotExist:
            return Response(
                {"detail": "Venue not found."}, status=status.HTTP_404_NOT_FOUND
            )

        visits = list(
            Review.objects.filter(venue=venue, user=request.user)
            .order_by("created_at")
            .values(
                "id", "rating", "text", "dish_name",
                "photo_url", "tags", "created_at",
            )
        )

        # Compute personal trend
        if len(visits) >= 2:
            ratings = [float(v["rating"]) for v in visits]
            first_half = sum(ratings[: len(ratings) // 2]) / max(len(ratings) // 2, 1)
            second_half = sum(ratings[len(ratings) // 2 :]) / max(
                len(ratings) - len(ratings) // 2, 1
            )
            diff = second_half - first_half
            if diff > 0.5:
                rating_trend = "improving"
            elif diff < -0.5:
                rating_trend = "declining"
            else:
                rating_trend = "stable"
        else:
            rating_trend = "stable"

        avg_rating = None
        if visits:
            avg_rating = Decimal(
                str(round(sum(float(v["rating"]) for v in visits) / len(visits), 2))
            )

        data = {
            "venue_obj": venue,
            "visits": visits,
            "visit_count": len(visits),
            "avg_rating": avg_rating,
            "rating_trend": rating_trend,
        }

        serializer = VenueUserTimelineSerializer(data)
        return Response(serializer.data)


def _build_dish_side(dish, months=12):
    """Build comparison data for one dish.

    Assumes ``dish`` has been fetched with ``select_related("venue")``.
    """
    since = timezone.now() - timedelta(days=months * 30)

    reviews = Review.objects.filter(dish=dish, created_at__gte=since)
    snapshots = _build_snapshots_from_reviews(reviews, "month")
    trend, _ = _compute_trend(snapshots)

    # Aggregate top tags from all reviews of this dish (single query)
    all_tags = list(
        Review.objects.filter(dish=dish)
        .exclude(tags=[])
        .values_list("tags", flat=True)
    )
    tag_counter = Counter()
    for tag_list in all_tags:
        if isinstance(tag_list, list):
            tag_counter.update(tag_list)
    top_tags = [tag for tag, _ in tag_counter.most_common(5)]

    return {
        "id": dish.id,
        "name": dish.name,
        "venue_name": dish.venue.name,
        "avg_rating": dish.avg_rating,
        "review_count": dish.review_count,
        "top_tags": top_tags,
        "recent_trend": trend,
        "rating_history": snapshots,
    }


class DishCompareView(APIView):
    """GET /api/dishes/compare/?dish_a={id}&dish_b={id}"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        dish_a_id = request.query_params.get("dish_a")
        dish_b_id = request.query_params.get("dish_b")

        if not dish_a_id or not dish_b_id:
            return Response(
                {"detail": "Both dish_a and dish_b query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dish_a = Dish.objects.select_related("venue").get(pk=dish_a_id)
        except (Dish.DoesNotExist, ValueError):
            return Response(
                {"detail": "Dish A not found."}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            dish_b = Dish.objects.select_related("venue").get(pk=dish_b_id)
        except (Dish.DoesNotExist, ValueError):
            return Response(
                {"detail": "Dish B not found."}, status=status.HTTP_404_NOT_FOUND
            )

        side_a = _build_dish_side(dish_a)
        side_b = _build_dish_side(dish_b)

        rating_diff = round(
            float(side_a["avg_rating"]) - float(side_b["avg_rating"]), 1
        )
        popularity_diff = side_a["review_count"] - side_b["review_count"]

        if abs(rating_diff) < 0.3:
            winner = "tie"
        elif rating_diff > 0:
            winner = "dish_a"
        else:
            winner = "dish_b"

        data = {
            "dish_a": side_a,
            "dish_b": side_b,
            "comparison": {
                "rating_difference": rating_diff,
                "popularity_difference": popularity_diff,
                "winner": winner,
            },
        }

        serializer = DishCompareSerializer(data)
        return Response(serializer.data)

from datetime import date, timedelta

from django.db.models import Count, Max, Sum
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ActivityDay,
    BadgeDefinition,
    DiningStreak,
    LeaderboardEntry,
    MonthlyRecap,
    UserBadge,
    UserStatsCache,
    UserXP,
    WrappedStats,
    XPTransaction,
)
from .serializers import (
    BadgeDefinitionSerializer,
    DiningStreakSerializer,
    LeaderboardEntrySerializer,
    MonthlyRecapSerializer,
    UserBadgeSerializer,
    UserStatsCacheSerializer,
    UserXPSerializer,
    WrappedStatsSerializer,
    XPTransactionSerializer,
)
from .services import get_activity_grid, get_user_xp_summary


class XPProfileView(APIView):
    """GET /api/gamification/xp/ — User's XP and level info."""

    def get(self, request):
        try:
            xp_profile = UserXP.objects.get(user=request.user)
            serializer = UserXPSerializer(xp_profile)
            return Response(serializer.data)
        except UserXP.DoesNotExist:
            return Response(get_user_xp_summary(request.user))


class XPHistoryView(generics.ListAPIView):
    """GET /api/gamification/xp/history/ — XP transaction history."""

    serializer_class = XPTransactionSerializer

    def get_queryset(self):
        return XPTransaction.objects.filter(user=self.request.user).order_by("-created_at")[:50]


class StreakView(APIView):
    """GET /api/gamification/streak/ — User's dining streak info."""

    def get(self, request):
        streak, _ = DiningStreak.objects.get_or_create(user=request.user)
        serializer = DiningStreakSerializer(streak)
        return Response(serializer.data)


class ActivityGridView(APIView):
    """GET /api/gamification/activity-grid/ — GitHub-style contribution grid."""

    def get(self, request):
        try:
            weeks = int(request.query_params.get("weeks", 52))
        except (ValueError, TypeError):
            weeks = 52
        weeks = min(weeks, 104)  # Max 2 years
        grid = get_activity_grid(request.user, weeks)
        return Response({"data": grid})


class BadgeListView(generics.ListAPIView):
    """GET /api/gamification/badges/ — All available badges."""

    serializer_class = BadgeDefinitionSerializer
    queryset = BadgeDefinition.objects.filter(is_active=True)


class UserBadgesView(generics.ListAPIView):
    """GET /api/gamification/my-badges/ — User's badges with progress."""

    serializer_class = UserBadgeSerializer

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).select_related("badge")


class LeaderboardView(APIView):
    """GET /api/gamification/leaderboard/ — Leaderboard rankings."""

    def get(self, request):
        board_type = request.query_params.get("type", "global")
        period = request.query_params.get("period", "weekly")
        scope = request.query_params.get("scope", "")
        try:
            limit = min(int(request.query_params.get("limit", 50)), 100)
        except (ValueError, TypeError):
            limit = 50

        entries = LeaderboardEntry.objects.select_related("user").filter(
            board_type=board_type, period=period
        )
        if scope:
            entries = entries.filter(scope=scope)
        entries = entries.order_by("rank")[:limit]

        serializer = LeaderboardEntrySerializer(entries, many=True)

        # Get current user's rank
        user_entry = LeaderboardEntry.objects.select_related("user").filter(
            user=request.user, board_type=board_type, period=period
        ).first()
        user_rank = LeaderboardEntrySerializer(user_entry).data if user_entry else None

        return Response({
            "data": serializer.data,
            "user_rank": user_rank,
        })


class FriendsLeaderboardView(APIView):
    """GET /api/gamification/leaderboard/friends/ — Friends-only leaderboard."""

    def get(self, request):
        from apps.users.models import Follow

        period = request.query_params.get("period", "weekly")

        # Get friends (people user follows)
        following_ids = Follow.objects.filter(
            follower=request.user
        ).values_list("following_id", flat=True)

        # Include self
        user_ids = list(following_ids) + [request.user.id]

        # Get this period's scores from XP transactions
        if period == "weekly":
            start_date = date.today() - timedelta(days=7)
        elif period == "monthly":
            start_date = date.today() - timedelta(days=30)
        else:
            start_date = None

        xp_query = XPTransaction.objects.filter(user_id__in=user_ids)
        if start_date:
            xp_query = xp_query.filter(created_at__date__gte=start_date)

        scores = xp_query.values("user_id").annotate(
            total_score=Sum("amount")
        ).order_by("-total_score")

        # Build leaderboard — bulk-fetch users to avoid N+1 queries
        from apps.users.models import User
        all_user_ids = [entry["user_id"] for entry in scores]
        users_by_id = {
            u.id: u for u in User.objects.filter(id__in=all_user_ids)
        }
        leaderboard = []
        for rank, entry in enumerate(scores, 1):
            user = users_by_id.get(entry["user_id"])
            if user is None:
                continue
            leaderboard.append({
                "rank": rank,
                "user_id": str(user.id),
                "user_name": user.name,
                "user_avatar": user.avatar_url,
                "user_level": user.level,
                "score": entry["total_score"] or 0,
                "is_self": user.id == request.user.id,
            })

        return Response({"data": leaderboard})


class WrappedView(APIView):
    """GET /api/gamification/wrapped/ — Year in Review stats."""

    def get(self, request):
        try:
            year = int(request.query_params.get("year", date.today().year - 1))
        except (ValueError, TypeError):
            year = date.today().year - 1
        try:
            wrapped = WrappedStats.objects.get(user=request.user, year=year)
            serializer = WrappedStatsSerializer(wrapped)
            return Response(serializer.data)
        except WrappedStats.DoesNotExist:
            return Response(
                {"error": f"No wrapped stats available for {year}"},
                status=status.HTTP_404_NOT_FOUND,
            )


class UserStatsView(APIView):
    """GET /api/gamification/stats/ — Activity dashboard stats."""

    def get(self, request):
        stats, _ = UserStatsCache.objects.get_or_create(user=request.user)
        serializer = UserStatsCacheSerializer(stats)
        return Response(serializer.data)


class MonthlyRecapView(APIView):
    """GET /api/gamification/monthly-recap/ — Monthly mini-recap stats."""

    def get(self, request):
        today = date.today()
        try:
            year = int(request.query_params.get("year", today.year))
            month = int(request.query_params.get("month", today.month))
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid year or month parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate month/year
        if month < 1 or month > 12:
            return Response(
                {"error": "Invalid month. Must be between 1 and 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Try to get cached recap
        try:
            recap = MonthlyRecap.objects.get(user=request.user, year=year, month=month)
            serializer = MonthlyRecapSerializer(recap)
            return Response(serializer.data)
        except MonthlyRecap.DoesNotExist:
            pass

        # Generate on-the-fly
        from apps.reviews.models import Review, ReviewLike

        # Date range for the month
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        # Reviews in this month
        month_reviews = Review.objects.filter(
            user=request.user,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        ).select_related("venue")

        total_reviews = month_reviews.count()

        if total_reviews == 0:
            return Response(
                {"error": f"No reviews found for {year}/{month:02d}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Total unique venues
        total_venues = month_reviews.values("venue").distinct().count()

        # Total photos
        total_photos = month_reviews.exclude(photo_url="").count()

        # Top cuisine (most reviewed cuisine type)
        cuisine_counts = (
            month_reviews.values("venue__cuisine_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        top_cuisine = cuisine_counts[0]["venue__cuisine_type"] if cuisine_counts else ""

        # New cuisines tried (cuisines in this month not reviewed before)
        prev_cuisines = set(
            Review.objects.filter(
                user=request.user,
                created_at__date__lt=start_date,
            ).values_list("venue__cuisine_type", flat=True).distinct()
        )
        month_cuisines = set(
            month_reviews.values_list("venue__cuisine_type", flat=True).distinct()
        )
        new_cuisines_tried = len(month_cuisines - prev_cuisines)

        # Top venue (most visited)
        venue_counts = (
            month_reviews.values("venue__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        top_venue_name = venue_counts[0]["venue__name"] if venue_counts else ""

        # Top rated dish
        top_dish = month_reviews.order_by("-rating").first()
        top_rated_dish = top_dish.dish_name if top_dish and top_dish.dish_name else ""

        # XP earned in this month
        xp_earned = (
            XPTransaction.objects.filter(
                user=request.user,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        # Likes received on reviews this month
        likes_received = (
            ReviewLike.objects.filter(
                review__user=request.user,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
            ).count()
        )

        # Longest streak in month from ActivityDay
        activity_days = list(
            ActivityDay.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date,
                review_count__gt=0,
            ).values_list("date", flat=True).order_by("date")
        )
        longest_streak = 0
        current_streak = 0
        prev_date = None
        for d in activity_days:
            if prev_date and (d - prev_date).days == 1:
                current_streak += 1
            else:
                current_streak = 1
            longest_streak = max(longest_streak, current_streak)
            prev_date = d

        # Only cache the recap if the month has fully ended
        month_has_ended = (year < today.year) or (year == today.year and month < today.month)

        recap_kwargs = dict(
            user=request.user,
            year=year,
            month=month,
            total_reviews=total_reviews,
            total_venues=total_venues,
            total_photos=total_photos,
            new_cuisines_tried=new_cuisines_tried,
            top_cuisine=top_cuisine,
            top_venue_name=top_venue_name,
            top_rated_dish=top_rated_dish,
            longest_streak_in_month=longest_streak,
            xp_earned=xp_earned,
            likes_received=likes_received,
            stats_data={
                "cuisine_breakdown": {
                    c["venue__cuisine_type"]: c["count"]
                    for c in cuisine_counts
                },
            },
        )

        if month_has_ended:
            recap = MonthlyRecap.objects.create(**recap_kwargs)
        else:
            # For the current month, return without persisting stale data
            recap = MonthlyRecap(**recap_kwargs)

        serializer = MonthlyRecapSerializer(recap)
        return Response(serializer.data)

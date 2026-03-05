from datetime import date, timedelta

from django.db.models import Sum
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    BadgeDefinition,
    DiningStreak,
    LeaderboardEntry,
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
        weeks = int(request.query_params.get("weeks", 52))
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
        limit = min(int(request.query_params.get("limit", 50)), 100)

        entries = LeaderboardEntry.objects.filter(
            board_type=board_type, period=period
        )
        if scope:
            entries = entries.filter(scope=scope)
        entries = entries.order_by("rank")[:limit]

        serializer = LeaderboardEntrySerializer(entries, many=True)

        # Get current user's rank
        user_entry = LeaderboardEntry.objects.filter(
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

        # Build leaderboard
        from apps.users.models import User
        leaderboard = []
        for rank, entry in enumerate(scores, 1):
            user = User.objects.get(id=entry["user_id"])
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
        year = int(request.query_params.get("year", date.today().year - 1))
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

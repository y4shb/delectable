from rest_framework import serializers

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


class UserXPSerializer(serializers.ModelSerializer):
    level_progress = serializers.SerializerMethodField()
    xp_in_level = serializers.SerializerMethodField()

    class Meta:
        model = UserXP
        fields = ["total_xp", "level", "xp_to_next_level", "level_progress", "xp_in_level"]

    def get_level_progress(self, obj):
        xp_for_current = UserXP.xp_for_level(obj.level)
        xp_for_next = UserXP.xp_for_level(obj.level + 1) if obj.level < 20 else obj.total_xp
        if obj.level >= 20:
            return 1.0
        range_xp = xp_for_next - xp_for_current
        return (obj.total_xp - xp_for_current) / max(1, range_xp)

    def get_xp_in_level(self, obj):
        xp_for_current = UserXP.xp_for_level(obj.level)
        return obj.total_xp - xp_for_current


class XPTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPTransaction
        fields = ["id", "reason", "amount", "description", "created_at"]


class DiningStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningStreak
        fields = [
            "current_streak",
            "longest_streak",
            "streak_freezes",
            "max_freezes",
            "last_activity_date",
            "flexible_mode",
        ]


class ActivityDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityDay
        fields = ["date", "review_count", "photo_count", "comment_count", "total_xp"]


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeDefinition
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "category",
            "tier",
            "icon_url",
            "requirement_type",
            "requirement_value",
            "xp_reward",
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeDefinitionSerializer(read_only=True)
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = UserBadge
        fields = ["id", "badge", "progress", "is_unlocked", "unlocked_at", "is_displayed", "progress_percent"]

    def get_progress_percent(self, obj):
        if obj.is_unlocked:
            return 100
        return int((obj.progress / max(1, obj.badge.requirement_value)) * 100)


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.URLField(source="user.avatar_url", read_only=True)
    user_level = serializers.IntegerField(source="user.level", read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = [
            "id",
            "user_name",
            "user_avatar",
            "user_level",
            "board_type",
            "period",
            "scope",
            "score",
            "rank",
        ]


class MonthlyRecapSerializer(serializers.ModelSerializer):
    month_name = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyRecap
        fields = [
            "year",
            "month",
            "month_name",
            "total_reviews",
            "total_venues",
            "total_photos",
            "new_cuisines_tried",
            "top_cuisine",
            "top_venue_name",
            "top_rated_dish",
            "longest_streak_in_month",
            "xp_earned",
            "likes_received",
            "stats_data",
            "generated_at",
        ]

    def get_month_name(self, obj):
        import calendar
        return calendar.month_name[obj.month]


class WrappedStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WrappedStats
        fields = [
            "year",
            "total_reviews",
            "total_venues",
            "total_photos",
            "total_xp",
            "levels_gained",
            "badges_earned",
            "longest_streak",
            "top_cuisine",
            "top_venue",
            "top_venue_visits",
            "total_likes_received",
            "total_comments_received",
            "new_followers",
            "stats_data",
            "generated_at",
        ]


class UserStatsCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStatsCache
        fields = [
            "total_reviews",
            "total_venues",
            "total_photos",
            "total_likes_given",
            "total_likes_received",
            "total_comments",
            "avg_rating",
            "favorite_cuisine",
            "review_this_week",
            "review_this_month",
            "last_refreshed",
        ]

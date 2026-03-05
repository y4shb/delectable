from rest_framework import serializers

from .models import (
    Challenge,
    ChallengeParticipant,
    ChallengeSubmission,
    DeferredDeepLink,
    InviteCode,
    PlaylistActivity,
    PlaylistCollaborator,
    Referral,
    ReferralReward,
    ShareCard,
)


class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = ["code", "max_uses", "use_count", "is_active", "created_at"]
        read_only_fields = ["code", "use_count", "created_at"]


class ReferralSerializer(serializers.ModelSerializer):
    invitee_name = serializers.CharField(source="invitee.name", read_only=True)
    invitee_avatar = serializers.URLField(source="invitee.avatar_url", read_only=True)

    class Meta:
        model = Referral
        fields = [
            "id",
            "invitee_name",
            "invitee_avatar",
            "status",
            "created_at",
            "activated_at",
        ]


class ReferralRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralReward
        fields = [
            "id",
            "reward_type",
            "tier",
            "reward_value",
            "claimed",
            "claimed_at",
            "created_at",
        ]


class ReferralStatsSerializer(serializers.Serializer):
    """Stats for referral program."""
    total_referrals = serializers.IntegerField()
    activated_referrals = serializers.IntegerField()
    pending_rewards = serializers.IntegerField()
    k_factor = serializers.FloatField()


class PlaylistCollaboratorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.URLField(source="user.avatar_url", read_only=True)

    class Meta:
        model = PlaylistCollaborator
        fields = ["id", "user", "user_name", "user_avatar", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


class PlaylistActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.URLField(source="user.avatar_url", read_only=True)

    class Meta:
        model = PlaylistActivity
        fields = [
            "id",
            "user_name",
            "user_avatar",
            "activity_type",
            "description",
            "created_at",
        ]


class ChallengeSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    is_participating = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            "id",
            "title",
            "description",
            "rules",
            "cover_image_url",
            "start_date",
            "end_date",
            "target_count",
            "cuisine_filter",
            "tag_filter",
            "xp_reward",
            "badge_slug",
            "status",
            "participant_count",
            "is_participating",
            "user_progress",
            "created_at",
        ]

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_is_participating(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.participants.filter(user=request.user).exists()

    def get_user_progress(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        participant = obj.participants.filter(user=request.user).first()
        if participant:
            return {
                "progress": participant.progress,
                "completed": participant.completed,
                "target": obj.target_count,
            }
        return None


class ChallengeParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.URLField(source="user.avatar_url", read_only=True)
    user_level = serializers.IntegerField(source="user.level", read_only=True)

    class Meta:
        model = ChallengeParticipant
        fields = [
            "id",
            "user_name",
            "user_avatar",
            "user_level",
            "progress",
            "completed",
            "joined_at",
        ]


class ChallengeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeSubmission
        fields = ["id", "review", "verified", "created_at"]
        read_only_fields = ["id", "verified", "created_at"]


class ShareCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareCard
        fields = [
            "id",
            "card_type",
            "platform",
            "image_url",
            "width",
            "height",
            "generated_at",
        ]


class DeepLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeferredDeepLink
        fields = [
            "fingerprint",
            "target_path",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "invite_code",
        ]

"""Models for sharing, referrals, deep linking, and challenges."""

import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index
from django.utils import timezone


def generate_invite_code():
    """Generate a unique 8-character invite code."""
    return secrets.token_urlsafe(6)[:8].upper()


def generate_share_code():
    """Generate a unique 6-character share code."""
    return secrets.token_urlsafe(4)[:6].lower()


class InviteCode(models.Model):
    """User's personal invite code for referrals."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invite_code"
    )
    code = models.CharField(max_length=20, unique=True, default=generate_invite_code)
    max_uses = models.PositiveIntegerField(default=100)
    use_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invite_codes"

    def __str__(self):
        return f"{self.user.name}: {self.code}"

    def can_use(self) -> bool:
        return self.is_active and self.use_count < self.max_uses


class Referral(models.Model):
    """Tracks referral relationships between users."""

    class Status(models.TextChoices):
        SIGNED_UP = "signed_up", "Signed Up"
        ACTIVATED = "activated", "Activated"
        CHURNED = "churned", "Churned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="referrals_sent"
    )
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="referral_received"
    )
    invite_code = models.ForeignKey(
        InviteCode, on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SIGNED_UP
    )
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "referrals"
        constraints = [
            models.UniqueConstraint(fields=["invitee"], name="uq_invitee"),
        ]

    def __str__(self):
        return f"{self.inviter.name} -> {self.invitee.name} ({self.status})"


class ReferralReward(models.Model):
    """Rewards earned through referrals."""

    class RewardType(models.TextChoices):
        XP_BONUS = "xp_bonus", "XP Bonus"
        BADGE = "badge", "Badge"
        PREMIUM_TRIAL = "premium_trial", "Premium Trial"

    class Tier(models.TextChoices):
        TIER_1 = "tier_1", "3 Referrals"
        TIER_2 = "tier_2", "10 Referrals"
        TIER_3 = "tier_3", "25 Referrals"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="referral_rewards"
    )
    reward_type = models.CharField(max_length=20, choices=RewardType.choices)
    tier = models.CharField(max_length=10, choices=Tier.choices)
    reward_value = models.PositiveIntegerField(default=0)
    claimed = models.BooleanField(default=False)
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "referral_rewards"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "reward_type", "tier"], name="uq_referral_reward"
            ),
        ]

    def __str__(self):
        return f"{self.user.name}: {self.tier} - {self.reward_type}"


class DeferredDeepLink(models.Model):
    """Tracks deep link clicks before app install for attribution."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fingerprint = models.CharField(max_length=64, unique=True)
    target_path = models.CharField(max_length=500)
    referrer = models.CharField(max_length=500, blank=True, default="")
    utm_source = models.CharField(max_length=100, blank=True, default="")
    utm_medium = models.CharField(max_length=100, blank=True, default="")
    utm_campaign = models.CharField(max_length=100, blank=True, default="")
    invite_code = models.CharField(max_length=20, blank=True, default="")
    resolved = models.BooleanField(default=False)
    resolved_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deep_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "deferred_deep_links"
        indexes = [
            Index(name="idx_deeplink_fingerprint", fields=["fingerprint"]),
        ]

    def __str__(self):
        return f"DeepLink: {self.target_path}"


class PlaylistCollaborator(models.Model):
    """Collaborator access for shared playlists."""

    class Role(models.TextChoices):
        VIEWER = "viewer", "Viewer"
        EDITOR = "editor", "Editor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlist = models.ForeignKey(
        "playlists.Playlist", on_delete=models.CASCADE, related_name="collaborators"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlist_collaborations"
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="playlist_invites_sent",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "playlist_collaborators"
        constraints = [
            models.UniqueConstraint(
                fields=["playlist", "user"], name="uq_playlist_collaborator"
            ),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.playlist.title} ({self.role})"


class PlaylistActivity(models.Model):
    """Activity feed for playlist changes."""

    class ActivityType(models.TextChoices):
        ITEM_ADDED = "item_added", "Item Added"
        ITEM_REMOVED = "item_removed", "Item Removed"
        COMMENT = "comment", "Comment"
        COLLABORATOR_ADDED = "collaborator_added", "Collaborator Added"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlist = models.ForeignKey(
        "playlists.Playlist", on_delete=models.CASCADE, related_name="activities"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlist_activities"
    )
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    description = models.CharField(max_length=500)
    related_object_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "playlist_activities"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.playlist.title}: {self.activity_type}"


class Challenge(models.Model):
    """Food challenge for gamification."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    rules = models.TextField()
    cover_image_url = models.URLField(max_length=500, blank=True, default="")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    target_count = models.PositiveIntegerField(default=5)
    cuisine_filter = models.CharField(max_length=100, blank=True, default="")
    tag_filter = models.CharField(max_length=100, blank=True, default="")
    xp_reward = models.PositiveIntegerField(default=500)
    badge_slug = models.CharField(max_length=50, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="challenges_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "challenges"
        ordering = ["-start_date"]

    def __str__(self):
        return self.title

    @property
    def is_active(self) -> bool:
        now = timezone.now()
        return self.status == self.Status.ACTIVE and self.start_date <= now <= self.end_date


class ChallengeParticipant(models.Model):
    """User participation in a challenge."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey(
        Challenge, on_delete=models.CASCADE, related_name="participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenge_participations"
    )
    progress = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    reward_claimed = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "challenge_participants"
        constraints = [
            models.UniqueConstraint(
                fields=["challenge", "user"], name="uq_challenge_participant"
            ),
        ]
        indexes = [
            Index(
                name="idx_challenge_progress",
                fields=["challenge", "-progress"],
            ),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.challenge.title} ({self.progress})"


class ChallengeSubmission(models.Model):
    """Review submission for a challenge."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant = models.ForeignKey(
        ChallengeParticipant, on_delete=models.CASCADE, related_name="submissions"
    )
    review = models.ForeignKey(
        "reviews.Review", on_delete=models.CASCADE, related_name="challenge_submissions"
    )
    verified = models.BooleanField(default=False)
    verification_notes = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "challenge_submissions"
        constraints = [
            models.UniqueConstraint(
                fields=["participant", "review"], name="uq_challenge_submission"
            ),
        ]

    def __str__(self):
        return f"Submission: {self.participant.user.name} - {self.review.id}"


class ShareCard(models.Model):
    """Generated share card images."""

    class CardType(models.TextChoices):
        REVIEW = "review", "Review"
        VENUE = "venue", "Venue"
        PLAYLIST = "playlist", "Playlist"
        PROFILE = "profile", "Profile"
        WRAPPED = "wrapped", "Wrapped"

    class Platform(models.TextChoices):
        INSTAGRAM_STORY = "ig_story", "Instagram Story"
        INSTAGRAM_FEED = "ig_feed", "Instagram Feed"
        TWITTER = "twitter", "Twitter"
        OG = "og", "Open Graph"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    card_type = models.CharField(max_length=20, choices=CardType.choices)
    platform = models.CharField(max_length=20, choices=Platform.choices)
    related_object_id = models.UUIDField()
    image_url = models.URLField(max_length=500)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "share_cards"
        indexes = [
            Index(
                name="idx_sharecard_lookup",
                fields=["card_type", "platform", "related_object_id"],
            ),
        ]

    def __str__(self):
        return f"ShareCard: {self.card_type}/{self.platform}"

"""Views for sharing, referrals, deep linking, and challenges."""

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.services import award_xp, check_badge_progress

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
from .serializers import (
    ChallengeParticipantSerializer,
    ChallengeSerializer,
    ChallengeSubmissionSerializer,
    DeepLinkSerializer,
    InviteCodeSerializer,
    PlaylistActivitySerializer,
    PlaylistCollaboratorSerializer,
    ReferralRewardSerializer,
    ReferralSerializer,
    ReferralStatsSerializer,
    ShareCardSerializer,
)
from .services import generate_share_card


# ---------------------------------------------------------------------------
# Invite/Referral Views
# ---------------------------------------------------------------------------


class MyInviteCodeView(APIView):
    """GET /api/sharing/invite-code/ — Get or create user's invite code."""

    throttle_scope = "referrals"

    def get(self, request):
        invite_code, _ = InviteCode.objects.get_or_create(user=request.user)
        serializer = InviteCodeSerializer(invite_code)
        return Response(serializer.data)


class ReferralListView(generics.ListAPIView):
    """GET /api/sharing/referrals/ — List user's referrals."""

    serializer_class = ReferralSerializer

    def get_queryset(self):
        return Referral.objects.filter(inviter=self.request.user).select_related("invitee")


class ReferralStatsView(APIView):
    """GET /api/sharing/referrals/stats/ — Referral program stats."""

    def get(self, request):
        referrals = Referral.objects.filter(inviter=request.user)
        total = referrals.count()
        activated = referrals.filter(status=Referral.Status.ACTIVATED).count()

        pending_rewards = ReferralReward.objects.filter(
            user=request.user, claimed=False
        ).count()

        # K-factor: invites * conversion rate
        k_factor = (activated / max(total, 1)) * total if total > 0 else 0

        serializer = ReferralStatsSerializer(
            data={
                "total_referrals": total,
                "activated_referrals": activated,
                "pending_rewards": pending_rewards,
                "k_factor": round(k_factor, 2),
            }
        )
        serializer.is_valid()
        return Response(serializer.data)


class ReferralRewardListView(generics.ListAPIView):
    """GET /api/sharing/referrals/rewards/ — User's referral rewards."""

    serializer_class = ReferralRewardSerializer

    def get_queryset(self):
        return ReferralReward.objects.filter(user=self.request.user)


class ClaimRewardView(APIView):
    """POST /api/sharing/referrals/rewards/{id}/claim/ — Claim a reward."""

    def post(self, request, id):
        try:
            reward = ReferralReward.objects.get(id=id, user=request.user, claimed=False)
        except ReferralReward.DoesNotExist:
            return Response(
                {"error": "Reward not found or already claimed"},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            reward.claimed = True
            reward.claimed_at = timezone.now()
            reward.save()

            # Award XP for claiming referral reward
            if reward.reward_type == ReferralReward.RewardType.XP_BONUS:
                award_xp(
                    request.user,
                    "referral",
                    custom_amount=reward.reward_value,
                    description=f"Referral reward: {reward.tier}",
                )

        return Response({"message": "Reward claimed successfully"})


# ---------------------------------------------------------------------------
# Playlist Collaboration Views
# ---------------------------------------------------------------------------


class PlaylistCollaboratorListView(generics.ListCreateAPIView):
    """GET/POST /api/playlists/{id}/collaborators/"""

    serializer_class = PlaylistCollaboratorSerializer

    def get_queryset(self):
        return PlaylistCollaborator.objects.filter(
            playlist_id=self.kwargs["playlist_id"]
        ).select_related("user")

    def perform_create(self, serializer):
        from apps.playlists.models import Playlist

        playlist = Playlist.objects.get(id=self.kwargs["playlist_id"])

        # Only owner can add collaborators
        if playlist.user != self.request.user:
            raise permissions.PermissionDenied("Only the owner can add collaborators")

        with transaction.atomic():
            collaborator = serializer.save(
                playlist=playlist, invited_by=self.request.user
            )

            # Create activity
            PlaylistActivity.objects.create(
                playlist=playlist,
                user=self.request.user,
                activity_type=PlaylistActivity.ActivityType.COLLABORATOR_ADDED,
                description=f"Added {collaborator.user.name} as {collaborator.role}",
                related_object_id=collaborator.id,
            )


class RemoveCollaboratorView(APIView):
    """DELETE /api/playlists/{playlist_id}/collaborators/{user_id}/"""

    def delete(self, request, playlist_id, user_id):
        from apps.playlists.models import Playlist

        playlist = Playlist.objects.get(id=playlist_id)

        # Owner or self can remove
        if playlist.user != request.user and str(request.user.id) != user_id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        deleted, _ = PlaylistCollaborator.objects.filter(
            playlist_id=playlist_id, user_id=user_id
        ).delete()

        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistActivityListView(generics.ListAPIView):
    """GET /api/playlists/{id}/activity/"""

    serializer_class = PlaylistActivitySerializer

    def get_queryset(self):
        return PlaylistActivity.objects.filter(
            playlist_id=self.kwargs["playlist_id"]
        ).select_related("user")[:50]


class ForkPlaylistView(APIView):
    """POST /api/playlists/{id}/fork/ — Fork a playlist."""

    def post(self, request, id):
        from apps.playlists.models import Playlist, PlaylistItem

        try:
            original = Playlist.objects.prefetch_related("items__venue").get(
                id=id, is_public=True
            )
        except Playlist.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Create forked playlist
            forked = Playlist.objects.create(
                user=request.user,
                title=f"{original.title} (Fork)",
                description=original.description,
                forked_from=original,
            )

            # Copy items
            for item in original.items.all():
                PlaylistItem.objects.create(
                    playlist=forked,
                    venue=item.venue,
                    caption=item.caption,
                    sort_order=item.sort_order,
                )
                forked.items_count += 1

            forked.save()

            # Update fork count on original
            Playlist.objects.filter(id=original.id).update(
                fork_count=original.fork_count + 1
            )

        return Response(
            {"playlist_id": str(forked.id), "slug": forked.slug},
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Challenge Views
# ---------------------------------------------------------------------------


class ChallengeListView(generics.ListAPIView):
    """GET /api/challenges/ — List active challenges."""

    serializer_class = ChallengeSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        now = timezone.now()
        return Challenge.objects.filter(
            status=Challenge.Status.ACTIVE,
            start_date__lte=now,
            end_date__gte=now,
        )


class ChallengeDetailView(generics.RetrieveAPIView):
    """GET /api/challenges/{id}/ — Challenge detail."""

    serializer_class = ChallengeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Challenge.objects.all()
    lookup_field = "id"


class JoinChallengeView(APIView):
    """POST /api/challenges/{id}/join/ — Join a challenge."""

    def post(self, request, id):
        try:
            challenge = Challenge.objects.get(id=id, status=Challenge.Status.ACTIVE)
        except Challenge.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not challenge.is_active:
            return Response(
                {"error": "Challenge is not currently active"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        participant, created = ChallengeParticipant.objects.get_or_create(
            challenge=challenge, user=request.user
        )

        if not created:
            return Response(
                {"error": "Already participating"},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = ChallengeParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChallengeLeaderboardView(generics.ListAPIView):
    """GET /api/challenges/{id}/leaderboard/"""

    serializer_class = ChallengeParticipantSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ChallengeParticipant.objects.filter(
            challenge_id=self.kwargs["id"]
        ).select_related("user").order_by("-progress", "joined_at")[:100]


class SubmitChallengeReviewView(APIView):
    """POST /api/challenges/{id}/submit/ — Submit a review for challenge."""

    def post(self, request, id):
        from apps.reviews.models import Review

        review_id = request.data.get("review_id")
        if not review_id:
            return Response(
                {"error": "review_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            participant = ChallengeParticipant.objects.get(
                challenge_id=id, user=request.user
            )
        except ChallengeParticipant.DoesNotExist:
            return Response(
                {"error": "Not participating in this challenge"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            review = Review.objects.get(id=review_id, user=request.user)
        except Review.DoesNotExist:
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if already submitted
        if ChallengeSubmission.objects.filter(
            participant=participant, review=review
        ).exists():
            return Response(
                {"error": "Review already submitted"},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            submission = ChallengeSubmission.objects.create(
                participant=participant, review=review, verified=True
            )

            # Update progress
            participant.progress += 1

            # Check completion
            challenge = participant.challenge
            if participant.progress >= challenge.target_count and not participant.completed:
                participant.completed = True
                participant.completed_at = timezone.now()

                # Award XP
                award_xp(
                    request.user,
                    "badge",
                    related_object_id=challenge.id,
                    description=f"Completed challenge: {challenge.title}",
                    custom_amount=challenge.xp_reward,
                )

            participant.save()

        return Response(ChallengeSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Share Card Views
# ---------------------------------------------------------------------------


class GenerateShareCardView(APIView):
    """POST /api/sharing/card/ — Generate a share card image."""

    def post(self, request):
        card_type = request.data.get("type")
        platform = request.data.get("platform", "og")
        object_id = request.data.get("object_id")

        if not card_type or not object_id:
            return Response(
                {"error": "type and object_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for existing valid card
        existing = ShareCard.objects.filter(
            card_type=card_type,
            platform=platform,
            related_object_id=object_id,
            expires_at__gt=timezone.now(),
        ).first()

        if existing:
            return Response(ShareCardSerializer(existing).data)

        # Generate new card
        card = generate_share_card(card_type, platform, object_id)
        if card:
            return Response(ShareCardSerializer(card).data)

        return Response(
            {"error": "Failed to generate share card"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ---------------------------------------------------------------------------
# Deep Link Views
# ---------------------------------------------------------------------------


class RecordDeepLinkView(APIView):
    """POST /api/sharing/deeplink/ — Record a deep link click."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DeepLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        DeferredDeepLink.objects.update_or_create(
            fingerprint=serializer.validated_data["fingerprint"],
            defaults=serializer.validated_data,
        )

        return Response({"recorded": True}, status=status.HTTP_201_CREATED)


class ResolveDeepLinkView(APIView):
    """POST /api/sharing/deeplink/resolve/ — Resolve deferred deep link."""

    def post(self, request):
        fingerprint = request.data.get("fingerprint")
        if not fingerprint:
            return Response({"target_path": None})

        try:
            deep_link = DeferredDeepLink.objects.get(
                fingerprint=fingerprint, resolved=False
            )
        except DeferredDeepLink.DoesNotExist:
            return Response({"target_path": None})

        with transaction.atomic():
            deep_link.resolved = True
            deep_link.resolved_user = request.user
            deep_link.resolved_at = timezone.now()
            deep_link.save()

            # Process invite code if present
            if deep_link.invite_code:
                try:
                    invite = InviteCode.objects.get(
                        code=deep_link.invite_code, is_active=True
                    )
                    if invite.can_use() and invite.user != request.user:
                        Referral.objects.get_or_create(
                            invitee=request.user,
                            defaults={
                                "inviter": invite.user,
                                "invite_code": invite,
                            },
                        )
                        InviteCode.objects.filter(id=invite.id).update(
                            use_count=invite.use_count + 1
                        )
                except InviteCode.DoesNotExist:
                    pass

        return Response({"target_path": deep_link.target_path})

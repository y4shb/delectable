"""Services for share card generation and referral processing."""

import hashlib
import io
import uuid
from datetime import timedelta
from typing import Optional

from django.core.files.base import ContentFile
from django.utils import timezone

from .models import InviteCode, Referral, ReferralReward, ShareCard

# Platform dimensions
PLATFORM_SIZES = {
    "ig_story": (1080, 1920),
    "ig_feed": (1080, 1080),
    "twitter": (1200, 675),
    "og": (1200, 630),
}


def generate_share_card(
    card_type: str, platform: str, object_id: str
) -> Optional[ShareCard]:
    """
    Generate a share card image for the given object.
    Returns ShareCard model instance or None if generation fails.

    Note: Full Pillow implementation would require actual image generation.
    This creates a placeholder for the infrastructure.
    """
    width, height = PLATFORM_SIZES.get(platform, (1200, 630))

    # In production, this would:
    # 1. Fetch the object data (review, venue, playlist, profile)
    # 2. Use Pillow to compose an image with:
    #    - Background image or gradient
    #    - Object photo
    #    - Text overlays (title, rating, user info)
    #    - "de." branding
    # 3. Save to cloud storage (S3)
    # 4. Return the URL

    # For now, create a placeholder URL
    placeholder_url = f"/api/sharing/card/{card_type}/{platform}/{object_id}.png"

    card = ShareCard.objects.create(
        card_type=card_type,
        platform=platform,
        related_object_id=object_id,
        image_url=placeholder_url,
        width=width,
        height=height,
        expires_at=timezone.now() + timedelta(days=7),
    )

    return card


def process_referral_signup(invitee, invite_code_str: str) -> Optional[Referral]:
    """Process a new user signup with an invite code."""
    if not invite_code_str:
        return None

    try:
        invite_code = InviteCode.objects.get(code=invite_code_str, is_active=True)
    except InviteCode.DoesNotExist:
        return None

    if not invite_code.can_use():
        return None

    if invite_code.user == invitee:
        return None

    # Create referral
    referral, created = Referral.objects.get_or_create(
        invitee=invitee,
        defaults={
            "inviter": invite_code.user,
            "invite_code": invite_code,
        },
    )

    if created:
        # Increment use count
        InviteCode.objects.filter(id=invite_code.id).update(
            use_count=invite_code.use_count + 1
        )

    return referral if created else None


def activate_referral(invitee) -> bool:
    """
    Activate a referral when the invitee becomes an active user.
    Called when user posts their first review.
    """
    try:
        referral = Referral.objects.get(invitee=invitee, status=Referral.Status.SIGNED_UP)
    except Referral.DoesNotExist:
        return False

    referral.status = Referral.Status.ACTIVATED
    referral.activated_at = timezone.now()
    referral.save()

    # Check and award tier rewards
    check_referral_tiers(referral.inviter)

    return True


def check_referral_tiers(user) -> list:
    """Check and create tier rewards for referral milestones."""
    activated_count = Referral.objects.filter(
        inviter=user, status=Referral.Status.ACTIVATED
    ).count()

    rewards_created = []

    # Tier thresholds
    tiers = [
        (3, ReferralReward.Tier.TIER_1, 500),
        (10, ReferralReward.Tier.TIER_2, 1500),
        (25, ReferralReward.Tier.TIER_3, 5000),
    ]

    for threshold, tier, xp_value in tiers:
        if activated_count >= threshold:
            reward, created = ReferralReward.objects.get_or_create(
                user=user,
                reward_type=ReferralReward.RewardType.XP_BONUS,
                tier=tier,
                defaults={"reward_value": xp_value},
            )
            if created:
                rewards_created.append(reward)

                # Create notification
                from apps.notifications.services import create_notification
                create_notification(
                    recipient=user,
                    notification_type="badge",
                    text=f"You unlocked a referral reward! {threshold} friends joined.",
                    priority="high",
                    extra_data={"reward_id": str(reward.id), "tier": tier},
                )

    return rewards_created


def generate_fingerprint(request) -> str:
    """Generate a fingerprint for deferred deep link attribution."""
    parts = [
        request.META.get("HTTP_USER_AGENT", ""),
        request.META.get("HTTP_ACCEPT_LANGUAGE", ""),
        request.META.get("REMOTE_ADDR", ""),
    ]
    combined = "|".join(parts)
    return hashlib.sha256(combined.encode()).hexdigest()[:64]

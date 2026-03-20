"""
Account management views: deletion, data export, and password reset.

Separated from views.py to keep files under the 500-line project limit.
"""

import logging
import re
import uuid as uuid_mod

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow, TasteMatchCache, User

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Account Deletion (Apple App Store / GDPR requirement)
# ---------------------------------------------------------------------------


class DeleteAccountView(APIView):
    """DELETE /api/auth/me/delete/ -- Permanently delete user account and all data."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "register"  # Reuse the strict rate limit

    def delete(self, request):
        user = request.user
        password = request.data.get("password")

        # Optional password confirmation
        if password and not user.check_password(password):
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid password.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # ----- Delete user content -----
            from apps.reviews.models import Bookmark, Comment, Review, ReviewLike, WantToTry

            Review.objects.filter(user=user).delete()
            ReviewLike.objects.filter(user=user).delete()
            Comment.objects.filter(user=user).delete()
            Bookmark.objects.filter(user=user).delete()
            WantToTry.objects.filter(user=user).delete()

            # ----- Delete playlists and saved playlists -----
            from apps.playlists.models import Playlist, SavedPlaylist

            Playlist.objects.filter(user=user).delete()
            SavedPlaylist.objects.filter(user=user).delete()

            # ----- Delete notifications -----
            from apps.notifications.models import Notification, NotificationPreference, VenueSaveReminder

            Notification.objects.filter(recipient=user).delete()
            Notification.objects.filter(actor=user).update(actor=None)
            NotificationPreference.objects.filter(user=user).delete()
            VenueSaveReminder.objects.filter(user=user).delete()

            # ----- Delete follows -----
            Follow.objects.filter(Q(follower=user) | Q(following=user)).delete()

            # ----- Delete taste match cache -----
            TasteMatchCache.objects.filter(Q(user_a=user) | Q(user_b=user)).delete()

            # ----- Delete gamification data -----
            from apps.gamification.models import (
                ActivityDay,
                DiningStreak,
                LeaderboardEntry,
                MonthlyRecap,
                UserBadge,
                UserStatsCache,
                UserXP,
                WrappedStats,
                XPTransaction,
            )

            UserXP.objects.filter(user=user).delete()
            XPTransaction.objects.filter(user=user).delete()
            DiningStreak.objects.filter(user=user).delete()
            ActivityDay.objects.filter(user=user).delete()
            UserBadge.objects.filter(user=user).delete()
            LeaderboardEntry.objects.filter(user=user).delete()
            WrappedStats.objects.filter(user=user).delete()
            MonthlyRecap.objects.filter(user=user).delete()
            UserStatsCache.objects.filter(user=user).delete()

            # ----- Delete sharing / challenge data -----
            from apps.sharing.models import (
                ChallengeParticipant,
                InviteCode,
                PlaylistActivity,
                PlaylistCollaborator,
                Referral,
                ReferralReward,
            )

            InviteCode.objects.filter(user=user).delete()
            Referral.objects.filter(Q(inviter=user) | Q(invitee=user)).delete()
            ReferralReward.objects.filter(user=user).delete()
            PlaylistCollaborator.objects.filter(user=user).delete()
            PlaylistActivity.objects.filter(user=user).delete()
            ChallengeParticipant.objects.filter(user=user).delete()

            # ----- Delete groups / dinner plan data -----
            from apps.groups.models import DinnerPlan, DinnerPlanMember, DinnerPlanVote

            DinnerPlanVote.objects.filter(user=user).delete()
            DinnerPlanMember.objects.filter(user=user).delete()
            DinnerPlan.objects.filter(creator=user).delete()

            # ----- Delete feed data -----
            from apps.feed.models import UserAffinity, UserTasteProfile

            UserAffinity.objects.filter(Q(user=user) | Q(target=user)).delete()
            UserTasteProfile.objects.filter(user=user).delete()

            # ----- Blacklist all outstanding JWT tokens -----
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

            OutstandingToken.objects.filter(user=user).delete()

            # ----- Anonymize user record -----
            user.email = f"deleted_{uuid_mod.uuid4().hex[:8]}@deleted.delectable.app"
            user.name = "Deleted User"
            user.avatar_url = ""
            user.bio = ""
            user.favorite_cuisines = []
            user.followers_count = 0
            user.following_count = 0
            user.is_active = False
            user.set_unusable_password()
            user.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Data Export (GDPR requirement)
# ---------------------------------------------------------------------------


class ExportDataView(APIView):
    """GET /api/auth/me/export/ -- Export all user data as downloadable JSON."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "user"

    def get(self, request):
        user = request.user

        from apps.reviews.models import Bookmark, Comment, Review, ReviewLike, WantToTry
        from apps.playlists.models import Playlist, SavedPlaylist
        from apps.notifications.models import Notification

        # Helper to convert UUIDs and Decimals for JSON serialization
        def _serialize_qs(qs, fields):
            rows = []
            for row in qs.values(*fields):
                serialized = {}
                for k, v in row.items():
                    if hasattr(v, "hex"):
                        serialized[k] = str(v)
                    elif hasattr(v, "isoformat"):
                        serialized[k] = v.isoformat()
                    elif hasattr(v, "__float__"):
                        serialized[k] = float(v)
                    else:
                        serialized[k] = v
                rows.append(serialized)
            return rows

        data = {
            "profile": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "level": user.level,
                "favorite_cuisines": user.favorite_cuisines,
                "created_at": user.created_at.isoformat(),
            },
            "reviews": _serialize_qs(
                Review.objects.filter(user=user),
                ("id", "venue_id", "rating", "text", "dish_name", "photo_url", "tags", "created_at"),
            ),
            "comments": _serialize_qs(
                Comment.objects.filter(user=user),
                ("id", "review_id", "parent_id", "text", "created_at"),
            ),
            "likes": _serialize_qs(
                ReviewLike.objects.filter(user=user),
                ("review_id", "created_at"),
            ),
            "bookmarks": _serialize_qs(
                Bookmark.objects.filter(user=user),
                ("review_id", "created_at"),
            ),
            "want_to_try": _serialize_qs(
                WantToTry.objects.filter(user=user),
                ("id", "venue_id", "note", "created_at"),
            ),
            "playlists": _serialize_qs(
                Playlist.objects.filter(user=user),
                ("id", "title", "description", "visibility", "items_count", "created_at"),
            ),
            "saved_playlists": _serialize_qs(
                SavedPlaylist.objects.filter(user=user),
                ("playlist_id", "created_at"),
            ),
            "following": _serialize_qs(
                Follow.objects.filter(follower=user),
                ("following_id", "created_at"),
            ),
            "followers": _serialize_qs(
                Follow.objects.filter(following=user),
                ("follower_id", "created_at"),
            ),
            "notifications": _serialize_qs(
                Notification.objects.filter(recipient=user),
                ("id", "notification_type", "text", "is_read", "created_at"),
            ),
        }

        response = Response(data)
        response["Content-Disposition"] = (
            f'attachment; filename="delectable_export_{user.id}.json"'
        )
        return response


# ---------------------------------------------------------------------------
# Password Reset Flow
# ---------------------------------------------------------------------------

_password_reset_token_generator = PasswordResetTokenGenerator()


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password/ -- Request a password reset email."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Email is required.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Always return 200 to prevent email enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"message": "If an account with that email exists, a reset link has been sent."},
                status=status.HTTP_200_OK,
            )

        # Generate token and uid
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = _password_reset_token_generator.make_token(user)

        # Build reset URL (frontend will parse uid + token)
        frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_base}/reset-password?uid={uid}&token={token}"

        # Send email (uses console backend in dev)
        try:
            send_mail(
                subject="Delectable - Reset your password",
                message=(
                    f"Hi {user.name},\n\n"
                    f"You requested a password reset. Click the link below to set a new password:\n\n"
                    f"{reset_url}\n\n"
                    f"This link will expire in 24 hours.\n\n"
                    f"If you did not request this, please ignore this email.\n\n"
                    f"-- The Delectable Team"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@delectable.app"),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send password reset email to %s", user.email)

        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password/ -- Set a new password using a reset token."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request):
        uid_b64 = request.data.get("uid", "")
        token = request.data.get("token", "")
        password = request.data.get("password", "")
        password_confirm = request.data.get("password_confirm", "")

        # Validate required fields
        if not uid_b64 or not token or not password:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "uid, token, and password are required.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password_confirm:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Passwords do not match.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password complexity (reuse same rules as registration)
        pw_errors = []
        if len(password) < 8:
            pw_errors.append("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", password):
            pw_errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", password):
            pw_errors.append("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", password):
            pw_errors.append("Password must contain at least one digit.")

        if pw_errors:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": pw_errors, "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Decode uid
        try:
            user_id = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid or expired reset link.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify token
        if not _password_reset_token_generator.check_token(user, token):
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid or expired reset link.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set new password
        user.set_password(password)
        user.save(update_fields=["password"])

        # Blacklist all outstanding tokens so the user must re-login
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        OutstandingToken.objects.filter(user=user).delete()

        return Response(
            {"message": "Password has been reset successfully. Please log in with your new password."},
            status=status.HTTP_200_OK,
        )

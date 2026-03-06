import math
from collections import defaultdict
from datetime import timedelta

from django.conf import settings
from django.db import models, transaction
from django.db.models import Count
from django.db.models.functions import Greatest
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Follow, TasteMatchCache, User
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserPrivateSerializer,
    UserPublicSerializer,
    UserSerializer,
)


def _set_refresh_cookie(response, refresh_token):
    """Set the refresh token as an HttpOnly cookie."""
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=str(refresh_token),
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
        secure=getattr(settings, "REFRESH_TOKEN_COOKIE_SECURE", True),
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )


def _clear_refresh_cookie(response):
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
    )


class RegisterView(APIView):
    """POST /api/auth/register/ — Create account, return tokens + user."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-follow tastemaker accounts for new users
        from apps.feed.engine import auto_follow_tastemakers
        auto_follow_tastemakers(user)

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "access": str(refresh.access_token),
                "user": UserSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
        _set_refresh_cookie(response, refresh)
        return response


class LoginView(APIView):
    """POST /api/auth/login/ — Authenticate, return access token + set refresh cookie."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "access": str(refresh.access_token),
                "user": UserSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, refresh)
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — Read refresh token from cookie, return new access token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if not raw_token:
            return Response(
                {"error": {"code": "UNAUTHORIZED", "message": "No refresh token.", "status": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh = RefreshToken(raw_token)
            # Blacklist the old token (rotation)
            old_refresh.blacklist()
        except TokenError:
            response = Response(
                {"error": {"code": "UNAUTHORIZED", "message": "Invalid or expired refresh token.", "status": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_refresh_cookie(response)
            return response

        # Issue new token pair
        try:
            user = User.objects.get(id=old_refresh["user_id"])
        except User.DoesNotExist:
            response = Response(
                {"error": {"code": "UNAUTHORIZED", "message": "User no longer exists.", "status": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_refresh_cookie(response)
            return response

        new_refresh = RefreshToken.for_user(user)

        response = Response(
            {"access": str(new_refresh.access_token)},
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklist refresh token, clear cookie."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if raw_token:
            try:
                token = RefreshToken(raw_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — Current user profile."""

    serializer_class = UserPrivateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    """GET /api/auth/users/{id}/ — Public user profile."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"


class FollowView(APIView):
    """POST/DELETE /api/auth/users/{id}/follow/ — Follow/unfollow user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        target = generics.get_object_or_404(User, id=id)
        if target == request.user:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Cannot follow yourself.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            _, created = Follow.objects.get_or_create(
                follower=request.user, following=target
            )
            if not created:
                return Response(
                    {"error": {"code": "CONFLICT", "message": "Already following this user.", "status": 409}},
                    status=status.HTTP_409_CONFLICT,
                )

            # Update counts
            User.objects.filter(id=request.user.id).update(
                following_count=models.F("following_count") + 1
            )
            User.objects.filter(id=target.id).update(
                followers_count=models.F("followers_count") + 1
            )

            # Create notification
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=target,
                notification_type="follow",
                text=f"{request.user.name} started following you",
                related_object_id=request.user.id,
            )

        return Response(
            {
                "data": {
                    "follower_id": str(request.user.id),
                    "following_id": str(target.id),
                }
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        target = generics.get_object_or_404(User, id=id)

        with transaction.atomic():
            deleted, _ = Follow.objects.filter(
                follower=request.user, following=target
            ).delete()

            if not deleted:
                return Response(
                    {"error": {"code": "NOT_FOUND", "message": "Not following this user.", "status": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Update counts
            User.objects.filter(id=request.user.id).update(
                following_count=Greatest(models.F("following_count") - 1, 0)
            )
            User.objects.filter(id=target.id).update(
                followers_count=Greatest(models.F("followers_count") - 1, 0)
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowerListView(generics.ListAPIView):
    """GET /api/auth/users/{id}/followers/"""

    serializer_class = UserPublicSerializer

    def get_queryset(self):
        user_id = self.kwargs["id"]
        follower_ids = Follow.objects.filter(
            following_id=user_id
        ).values_list("follower_id", flat=True)
        return User.objects.filter(id__in=follower_ids)


class FollowingListView(generics.ListAPIView):
    """GET /api/auth/users/{id}/following/"""

    serializer_class = UserPublicSerializer

    def get_queryset(self):
        user_id = self.kwargs["id"]
        following_ids = Follow.objects.filter(
            follower_id=user_id
        ).values_list("following_id", flat=True)
        return User.objects.filter(id__in=following_ids)


class SuggestedUsersView(generics.ListAPIView):
    """GET /api/auth/suggested-users/ — Suggest users based on social/taste signals."""

    serializer_class = UserSerializer

    def get_queryset(self):
        me = self.request.user
        # Users I already follow
        following_ids = set(
            Follow.objects.filter(follower=me).values_list("following_id", flat=True)
        )

        # Candidates: not me, not already followed
        candidates = User.objects.exclude(id=me.id).exclude(id__in=following_ids)

        # Score each candidate
        # 1. Mutual followers (friends of friends) - FIXED: Batch query instead of N+1
        mutual_map = defaultdict(int)
        if following_ids:
            # Get all follows from people I follow in a single query
            friends_follows = Follow.objects.filter(
                follower_id__in=following_ids
            ).values_list("follower_id", "following_id")
            for follower_id, following_id in friends_follows:
                if following_id != me.id and following_id not in following_ids:
                    mutual_map[following_id] += 1

        # 2. Venue overlap (shared reviewed venues)
        from apps.reviews.models import Review
        my_venue_ids = set(
            Review.objects.filter(user=me).values_list("venue_id", flat=True)
        )
        venue_overlap_map = {}
        if my_venue_ids:
            overlap_qs = (
                Review.objects.filter(venue_id__in=my_venue_ids)
                .exclude(user=me)
                .exclude(user_id__in=following_ids)
                .values("user_id")
                .annotate(shared=Count("venue_id", distinct=True))
            )
            venue_overlap_map = {r["user_id"]: r["shared"] for r in overlap_qs}

        # 3. Cuisine match
        my_cuisines = set(me.favorite_cuisines or [])

        # Fetch candidates in batch with only needed fields
        candidate_list = list(
            candidates.only("id", "favorite_cuisines", "followers_count")[:200]
        )

        scored = []
        for c in candidate_list:
            mutual = mutual_map.get(c.id, 0)
            venue_overlap = venue_overlap_map.get(c.id, 0)
            their_cuisines = set(c.favorite_cuisines or [])
            cuisine_match = (
                len(my_cuisines & their_cuisines) / max(len(my_cuisines | their_cuisines), 1)
                if my_cuisines
                else 0
            )
            popularity = min(c.followers_count / 100, 1.0)

            score = (
                0.4 * min(mutual / 3, 1.0)
                + 0.3 * min(venue_overlap / 5, 1.0)
                + 0.2 * cuisine_match
                + 0.1 * popularity
            )
            if score > 0:
                scored.append((c.id, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_ids = [uid for uid, _ in scored[:10]]

        if not top_ids:
            # Fallback: popular users
            return candidates.order_by("-followers_count")[:10]

        # Batch fetch all users in a single query to avoid N+1
        users_by_id = {u.id: u for u in User.objects.filter(id__in=top_ids)}
        # Preserve ordering
        return [users_by_id[uid] for uid in top_ids if uid in users_by_id]


def compute_taste_match(user_a, user_b):
    """Compute taste match between two users using Adjusted Cosine + Jaccard."""
    from apps.reviews.models import Review

    reviews_a = {
        r["venue_id"]: float(r["rating"])
        for r in Review.objects.filter(user=user_a).values("venue_id", "rating")
    }
    reviews_b = {
        r["venue_id"]: float(r["rating"])
        for r in Review.objects.filter(user=user_b).values("venue_id", "rating")
    }

    all_venues_a = set(reviews_a.keys())
    all_venues_b = set(reviews_b.keys())
    shared_venues = all_venues_a & all_venues_b

    # Jaccard similarity
    union = all_venues_a | all_venues_b
    jaccard = len(shared_venues) / max(len(union), 1)

    # Adjusted cosine similarity
    adj_cosine = 0.0
    if len(shared_venues) >= 1:
        mean_a = sum(reviews_a.values()) / max(len(reviews_a), 1)
        mean_b = sum(reviews_b.values()) / max(len(reviews_b), 1)

        dot = 0.0
        norm_a = 0.0
        norm_b = 0.0
        for v in shared_venues:
            da = reviews_a[v] - mean_a
            db = reviews_b[v] - mean_b
            dot += da * db
            norm_a += da * da
            norm_b += db * db

        denom = math.sqrt(norm_a) * math.sqrt(norm_b)
        if denom > 0:
            adj_cosine = max(0, (dot / denom + 1) / 2)  # normalize to 0-1
        else:
            adj_cosine = 0.5  # identical ratings on shared venues

    raw_score = 0.7 * adj_cosine + 0.3 * jaccard

    # Confidence dampening for < 3 shared venues
    confidence = min(len(shared_venues) / 3, 1.0)
    score = raw_score * confidence

    return score, list(shared_venues)


class TasteMatchView(APIView):
    """GET /api/auth/users/{id}/taste-match/ — Taste match with another user."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "taste_match"

    def get(self, request, id):
        other = generics.get_object_or_404(User, id=id)
        me = request.user

        if me.id == other.id:
            return Response(
                {"score": 1.0, "shared_venues": []},
                status=status.HTTP_200_OK,
            )

        # Check cache
        user_a, user_b = sorted([me, other], key=lambda u: str(u.id))
        cached = TasteMatchCache.objects.filter(user_a=user_a, user_b=user_b).first()

        cache_ttl = timedelta(hours=24)
        if cached and (timezone.now() - cached.computed_at) < cache_ttl:
            score = cached.score
            shared_venues = cached.shared_venues
        else:
            score, shared_venues = compute_taste_match(me, other)
            TasteMatchCache.objects.update_or_create(
                user_a=user_a,
                user_b=user_b,
                defaults={"score": score, "shared_venues": shared_venues},
            )

        return Response(
            {
                "score": round(score, 3),
                "shared_venues": shared_venues,
            },
            status=status.HTTP_200_OK,
        )


class UserPlaylistsView(generics.ListAPIView):
    """GET /api/auth/users/{id}/playlists/ — Get user's visible playlists."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from apps.playlists.models import Playlist, PlaylistVisibility

        user_id = self.kwargs.get("id")
        qs = Playlist.objects.filter(user_id=user_id).select_related("user", "forked_from__user")

        # If viewing own playlists, show all
        if str(user_id) == str(self.request.user.id):
            return qs

        # Check if viewer follows the owner
        is_following = Follow.objects.filter(
            follower=self.request.user, following_id=user_id
        ).exists()

        if is_following:
            # Followers see public + followers-only
            return qs.filter(
                visibility__in=[PlaylistVisibility.PUBLIC, PlaylistVisibility.FOLLOWERS]
            )
        else:
            # Non-followers only see public
            return qs.filter(visibility=PlaylistVisibility.PUBLIC)

    def get_serializer_class(self):
        from apps.playlists.serializers import PlaylistListSerializer
        return PlaylistListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

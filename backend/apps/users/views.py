from django.conf import settings
from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Follow, User
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
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

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
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
                "user": UserSerializer(user).data,
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
        user = User.objects.get(id=old_refresh["user_id"])
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

    serializer_class = UserSerializer

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

    def post(self, request, id):
        target = generics.get_object_or_404(User, id=id)
        if target == request.user:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Cannot follow yourself.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            following_count=models.F("following_count") - 1
        )
        User.objects.filter(id=target.id).update(
            followers_count=models.F("followers_count") - 1
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

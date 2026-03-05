from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import Follow, User


class UserSerializer(serializers.ModelSerializer):
    """Public user profile serializer with social graph flags."""

    is_following = serializers.SerializerMethodField()
    is_followed_by = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "avatar_url",
            "bio",
            "level",
            "followers_count",
            "following_count",
            "favorite_cuisines",
            "is_following",
            "is_followed_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "level",
            "followers_count",
            "following_count",
            "is_following",
            "is_followed_by",
            "created_at",
        ]

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.id == obj.id:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()

    def get_is_followed_by(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.id == obj.id:
            return False
        return Follow.objects.filter(follower=obj, following=request.user).exists()


class UserPrivateSerializer(UserSerializer):
    """Private user serializer that includes email, used only for /auth/me/ endpoint."""

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["email"]
        read_only_fields = UserSerializer.Meta.read_only_fields + ["email"]


class UserPublicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for embedding in feed/review/comment responses."""

    class Meta:
        model = User
        fields = ["id", "name", "avatar_url", "level"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Validate password complexity requirements."""
        import re

        errors = []

        if len(value) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            errors.append("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", value):
            errors.append("Password must contain at least one digit.")

        if errors:
            raise serializers.ValidationError(errors)

        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request=self.context.get("request"),
            username=data["email"],
            password=data["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        data["user"] = user
        return data

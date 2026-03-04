import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email login, UUID PK, and social profile fields."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    bio = models.TextField(max_length=300, blank=True, default="")
    level = models.PositiveIntegerField(default=1)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    favorite_cuisines = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.name


class Follow(models.Model):
    """Directional follow relationship between users."""

    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_set"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower_set"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follows"
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="uq_follow_pair",
            ),
            models.CheckConstraint(
                check=~models.Q(follower=models.F("following")),
                name="chk_no_self_follow",
            ),
        ]

    def __str__(self):
        return f"{self.follower} -> {self.following}"


class TasteMatchCache(models.Model):
    """Pre-computed taste match score between two users."""

    user_a = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="taste_matches_as_a"
    )
    user_b = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="taste_matches_as_b"
    )
    score = models.FloatField()
    shared_venues = models.JSONField(default=list)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "taste_match_cache"
        constraints = [
            models.UniqueConstraint(
                fields=["user_a", "user_b"],
                name="uq_taste_match_pair",
            ),
        ]

    def __str__(self):
        return f"{self.user_a} ↔ {self.user_b}: {self.score:.0%}"

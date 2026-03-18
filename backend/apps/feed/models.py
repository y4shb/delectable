import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index


class UserAffinity(models.Model):
    """Cached social affinity score between a viewer and a content creator.

    Updated on interactions (like, comment, follow) to avoid repeated computation.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="affinities_as_viewer",
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="affinities_as_target",
    )
    is_following = models.BooleanField(default=False)
    interaction_count = models.PositiveIntegerField(default=0)
    has_mutual_follow = models.BooleanField(default=False)
    score = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_affinity"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "target"],
                name="uq_user_affinity_pair",
            ),
        ]
        indexes = [
            Index(name="idx_affinity_user_score", fields=["user", "-score"]),
            models.Index(fields=["user", "updated_at"], name="idx_affinity_user_updated"),
        ]

    def __str__(self):
        return f"{self.user} → {self.target}: {self.score:.2f}"


class VenueTrendingScore(models.Model):
    """Cached trending score for a venue, recomputed periodically."""

    venue = models.OneToOneField(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="trending_score",
    )
    score = models.FloatField(default=0.0)
    review_velocity = models.FloatField(default=0.0)
    z_score = models.FloatField(default=0.0)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "venue_trending_scores"
        ordering = ["-score"]
        indexes = [
            Index(name="idx_trending_score", fields=["-score"]),
        ]

    def __str__(self):
        return f"{self.venue}: {self.score:.2f}"


class UserTasteProfile(models.Model):
    """User's taste preferences for cold-start and personalization."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="taste_profile",
    )
    preferred_cuisines = models.JSONField(default=list, blank=True)
    dietary_restrictions = models.JSONField(default=list, blank=True)
    price_preference = models.CharField(
        max_length=20,
        choices=[("budget", "Budget"), ("mid", "Mid-Range"), ("fine", "Fine Dining"), ("any", "Any")],
        default="any",
    )
    spice_tolerance = models.PositiveSmallIntegerField(default=3)  # 1-5
    completed_wizard = models.BooleanField(default=False)
    maturity_level = models.PositiveSmallIntegerField(default=0)  # 0-5
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_taste_profiles"

    def __str__(self):
        return f"TasteProfile({self.user})"

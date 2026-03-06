import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index

from apps.core.models import TimeStampedModel


class PairwiseComparison(models.Model):
    """A single head-to-head comparison between two venues made by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pairwise_comparisons",
    )
    venue_a = models.ForeignKey(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="comparisons_as_a",
    )
    venue_b = models.ForeignKey(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="comparisons_as_b",
    )
    winner = models.ForeignKey(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="comparison_wins",
        null=True,
        blank=True,
        help_text="Null means 'too tough to call' (draw).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pairwise_comparisons"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue_a", "venue_b"],
                name="uq_comparison_user_venue_pair",
            ),
        ]
        indexes = [
            Index(
                name="idx_comparison_user_created",
                fields=["user", "-created_at"],
            ),
        ]

    def __str__(self):
        winner_name = self.winner.name if self.winner else "draw"
        return (
            f"{self.user} compared {self.venue_a.name} vs {self.venue_b.name}"
            f" -> {winner_name}"
        )

    def save(self, *args, **kwargs):
        # Enforce ordered pair: venue_a.pk < venue_b.pk to prevent duplicates
        if str(self.venue_a_id) > str(self.venue_b_id):
            self.venue_a_id, self.venue_b_id = self.venue_b_id, self.venue_a_id
        super().save(*args, **kwargs)


class PersonalRanking(TimeStampedModel):
    """A user's personal Elo ranking for a venue."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="personal_rankings",
    )
    venue = models.ForeignKey(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="personal_rankings",
    )
    elo_score = models.FloatField(
        default=1500.0,
        help_text="Elo rating for this venue in the user's personal ranking.",
    )
    comparison_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of comparisons this venue has participated in.",
    )
    confidence = models.FloatField(
        default=0.0,
        help_text="Confidence level 0-1 based on number of comparisons.",
    )
    rank = models.PositiveIntegerField(
        default=0,
        help_text="Position in the user's personal ranking (1-based).",
    )

    class Meta:
        db_table = "personal_rankings"
        ordering = ["-elo_score"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue"],
                name="uq_personal_ranking_user_venue",
            ),
        ]
        indexes = [
            Index(
                name="idx_ranking_user_elo",
                fields=["user", "-elo_score"],
            ),
            Index(
                name="idx_ranking_user_rank",
                fields=["user", "rank"],
            ),
        ]

    def __str__(self):
        return f"{self.user} ranks {self.venue.name} #{self.rank} (Elo: {self.elo_score:.0f})"

import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index

from apps.core.models import TimeStampedModel


class Venue(TimeStampedModel):
    """Restaurant / food venue with geospatial support."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=300)
    location_text = models.CharField(max_length=500, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    cuisine_type = models.CharField(max_length=100, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(
        max_digits=3, decimal_places=1, default=0,
    )
    reviews_count = models.PositiveIntegerField(default=0)
    photo_url = models.URLField(max_length=500, blank=True, default="")
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    google_place_id = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        db_table = "venues"
        ordering = ["-rating"]
        indexes = [
            Index(name="idx_venue_cuisine_rating", fields=["cuisine_type", "-rating"]),
        ]

    def __str__(self):
        return self.name


class Dish(models.Model):
    """A specific dish at a venue."""

    CATEGORY_CHOICES = [
        ("appetizer", "Appetizer"),
        ("main", "Main"),
        ("dessert", "Dessert"),
        ("drink", "Drink"),
        ("side", "Side"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="dishes")
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True, choices=CATEGORY_CHOICES)
    avg_rating = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    review_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "dishes"
        ordering = ["-review_count"]
        unique_together = [("venue", "name")]

    def __str__(self):
        return f"{self.name} @ {self.venue.name}"


class OccasionTag(models.Model):
    """Predefined occasion/vibe tag (e.g. Date Night, Brunch)."""

    CATEGORY_CHOICES = [
        ("social", "Social"),
        ("time", "Time"),
        ("vibe", "Vibe"),
    ]

    slug = models.SlugField(primary_key=True, max_length=80)
    label = models.CharField(max_length=100)
    emoji = models.CharField(max_length=8)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    class Meta:
        db_table = "occasion_tags"
        ordering = ["category", "label"]

    def __str__(self):
        return f"{self.emoji} {self.label}"


class VenueOccasion(models.Model):
    """Association between a venue and an occasion tag with vote count."""

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="occasions")
    occasion = models.ForeignKey(OccasionTag, on_delete=models.CASCADE)
    vote_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "venue_occasions"
        ordering = ["-vote_count"]
        unique_together = [("venue", "occasion")]

    def __str__(self):
        return f"{self.venue.name} - {self.occasion.label}"


class OccasionVote(models.Model):
    """A user's vote for a venue-occasion pair."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="occasion_votes"
    )
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    occasion = models.ForeignKey(OccasionTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "occasion_votes"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue", "occasion"],
                name="uq_occasion_vote_user_venue_occasion",
            )
        ]

    def __str__(self):
        return f"{self.user} voted {self.occasion.label} for {self.venue.name}"


class DietaryReport(TimeStampedModel):
    """User-reported dietary information about a venue or dish."""

    CATEGORY_CHOICES = [
        ("vegan", "Vegan"),
        ("vegetarian", "Vegetarian"),
        ("gluten-free", "Gluten Free"),
        ("halal", "Halal"),
        ("kosher", "Kosher"),
        ("dairy-free", "Dairy Free"),
        ("nut-free", "Nut Free"),
    ]

    SCOPE_CHOICES = [
        ("venue", "Venue"),
        ("dish", "Dish"),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="dietary_reports")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dietary_reports"
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="venue")
    dish = models.ForeignKey(
        Dish, on_delete=models.SET_NULL, null=True, blank=True, related_name="dietary_reports"
    )
    is_available = models.BooleanField()

    class Meta:
        db_table = "dietary_reports"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue", "category", "scope"],
                name="uq_dietary_report_user_venue_cat_scope",
            )
        ]

    def __str__(self):
        return f"{self.category} @ {self.venue.name} ({self.scope})"


class VenueSimilarity(models.Model):
    """Pre-computed similarity score between two venues."""

    venue_a = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="similarities_as_a")
    venue_b = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="similarities_as_b")
    score = models.FloatField()
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "venue_similarities"
        ordering = ["-score"]
        constraints = [
            models.UniqueConstraint(
                fields=["venue_a", "venue_b"],
                name="uq_venue_similarity_pair",
            )
        ]
        indexes = [
            Index(name="idx_similarity_a_score", fields=["venue_a", "-score"]),
        ]

    def __str__(self):
        return f"{self.venue_a.name} ~ {self.venue_b.name}: {self.score:.2f}"

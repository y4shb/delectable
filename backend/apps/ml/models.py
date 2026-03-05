"""Models for ML/AI features."""

import uuid

from django.conf import settings
from django.db import models
from django.db.models.indexes import Index


class VenueIngestion(models.Model):
    """Tracks venue data ingestion from external sources."""

    class Source(models.TextChoices):
        GOOGLE_PLACES = "google_places", "Google Places"
        YELP = "yelp", "Yelp"
        MANUAL = "manual", "Manual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.CharField(max_length=20, choices=Source.choices)
    external_id = models.CharField(max_length=200)
    venue = models.ForeignKey(
        "venues.Venue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ingestions",
    )
    raw_data = models.JSONField()
    processed = models.BooleanField(default=False)
    quality_score = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "venue_ingestions"
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"], name="uq_venue_ingestion"
            ),
        ]
        indexes = [
            Index(name="idx_ingestion_processed", fields=["processed", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.source}: {self.external_id}"


class ReviewAuthenticity(models.Model):
    """ML-scored authenticity check for reviews."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.OneToOneField(
        "reviews.Review", on_delete=models.CASCADE, related_name="authenticity"
    )
    authenticity_score = models.FloatField(default=0.5)
    is_trusted = models.BooleanField(default=True)
    flags = models.JSONField(default=list)
    model_version = models.CharField(max_length=50, default="v1")
    scored_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "review_authenticity"

    def __str__(self):
        return f"Authenticity: {self.review.id} ({self.authenticity_score:.2f})"


class VenueRecommendation(models.Model):
    """Cached personalized venue recommendations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="venue_recommendations",
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="user_recommendations"
    )
    score = models.FloatField()
    reason = models.CharField(max_length=500, blank=True, default="")
    reason_type = models.CharField(max_length=50, blank=True, default="")
    model_version = models.CharField(max_length=50, default="v1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "venue_recommendations"
        indexes = [
            Index(
                name="idx_recommendation_user",
                fields=["user", "-score"],
            ),
        ]

    def __str__(self):
        return f"Rec: {self.user.name} -> {self.venue.name} ({self.score:.2f})"


class MLModelMetadata(models.Model):
    """Metadata for deployed ML models."""

    class ModelType(models.TextChoices):
        AUTHENTICITY = "authenticity", "Review Authenticity"
        RANKING = "ranking", "Venue Ranking"
        RECOMMENDATION = "recommendation", "Recommendation"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model_type = models.CharField(max_length=20, choices=ModelType.choices)
    version = models.CharField(max_length=50)
    file_path = models.CharField(max_length=500)
    is_active = models.BooleanField(default=False)
    metrics = models.JSONField(default=dict)
    trained_at = models.DateTimeField()
    deployed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ml_model_metadata"
        constraints = [
            models.UniqueConstraint(
                fields=["model_type", "version"], name="uq_ml_model"
            ),
        ]

    def __str__(self):
        return f"{self.model_type}: {self.version}"


class TrendingItem(models.Model):
    """Detected trending venues and dishes."""

    class ItemType(models.TextChoices):
        VENUE = "venue", "Venue"
        DISH = "dish", "Dish"
        CUISINE = "cuisine", "Cuisine"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    item_id = models.UUIDField()
    item_name = models.CharField(max_length=200)
    trend_score = models.FloatField()
    velocity = models.FloatField(default=0)
    explanation = models.CharField(max_length=500, blank=True, default="")
    region = models.CharField(max_length=100, blank=True, default="")
    detected_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "trending_items"
        indexes = [
            Index(
                name="idx_trending",
                fields=["item_type", "-trend_score"],
            ),
        ]

    def __str__(self):
        return f"Trending: {self.item_name} ({self.trend_score:.2f})"

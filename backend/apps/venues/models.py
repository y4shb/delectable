import uuid

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

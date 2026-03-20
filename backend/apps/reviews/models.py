import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.db.models.indexes import Index

from apps.core.models import TimeStampedModel


class Review(TimeStampedModel):
    """A user's review of a venue."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="reviews"
    )
    dish = models.ForeignKey(
        "venues.Dish", on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews"
    )
    rating = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    text = models.TextField(max_length=2000, blank=True, default="")
    photo_url = models.URLField(max_length=500, blank=True, default="")
    dish_name = models.CharField(max_length=200, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    quality_score = models.FloatField(default=0.0)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue"],
                condition=Q(dish__isnull=True),
                name="uq_review_user_venue_no_dish",
            ),
            models.UniqueConstraint(
                fields=["user", "venue", "dish"],
                condition=Q(dish__isnull=False),
                name="uq_review_user_venue_dish",
            ),
        ]
        indexes = [
            Index(name="idx_review_user_created", fields=["user", "-created_at"]),
            Index(name="idx_review_venue_created", fields=["venue", "-created_at"]),
            models.Index(fields=['user', '-created_at', '-like_count'], name='idx_review_feed'),
            models.Index(fields=['venue', '-created_at'], name='idx_review_venue_date'),
            models.Index(fields=['-created_at', '-like_count'], name='idx_review_trending'),
        ]

    def __str__(self):
        return f"{self.user} → {self.venue} ({self.rating})"


class ReviewPhoto(models.Model):
    """Additional photo attached to a review (supports multi-photo reviews)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="photos"
    )
    photo_url = models.URLField(max_length=500)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "review_photos"
        ordering = ["sort_order"]
        indexes = [
            Index(name="idx_reviewphoto_review", fields=["review", "sort_order"]),
        ]

    def __str__(self):
        return f"Photo {self.sort_order} for {self.review_id}"


class ReviewLike(models.Model):
    """Like on a review."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_likes"
    )
    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="likes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_likes"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "review"],
                name="uq_reviewlike_user_review",
            )
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_reviewlike_user"),
        ]


class Comment(TimeStampedModel):
    """Comment on a review, with optional threading (max depth 1)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="comments"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
    )
    text = models.TextField(max_length=2000)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]
        indexes = [
            Index(name="idx_comment_review_created", fields=["review", "created_at"]),
            models.Index(fields=["user"], name="idx_comment_user"),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(parent__isnull=True) | Q(parent__isnull=False),
                name="chk_comment_parent_valid",
            ),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.parent and self.parent.review_id != self.review_id:
            raise ValidationError("Parent comment must belong to the same review.")
        if self.parent and self.parent.parent_id is not None:
            raise ValidationError("Cannot reply to a reply (max depth 1).")

    def __str__(self):
        return f"{self.user} on {self.review.id}: {self.text[:50]}"


class Bookmark(models.Model):
    """User bookmark on a review."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks"
    )
    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="bookmarks"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bookmarks"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "review"],
                name="uq_bookmark_user_review",
            )
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_bookmark_user"),
        ]

    def __str__(self):
        return f"{self.user} bookmarked {self.review.id}"


class ContentReport(TimeStampedModel):
    """User-submitted report for content moderation (Apple App Store requirement)."""

    class ReportType(models.TextChoices):
        SPAM = "spam", "Spam"
        INAPPROPRIATE = "inappropriate", "Inappropriate Content"
        HARASSMENT = "harassment", "Harassment"
        FALSE_INFO = "false_info", "False Information"
        COPYRIGHT = "copyright", "Copyright Violation"
        OTHER = "other", "Other"

    class ReportContentType(models.TextChoices):
        REVIEW = "review", "Review"
        COMMENT = "comment", "Comment"
        USER = "user", "User Profile"
        PHOTO = "photo", "Photo"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        REVIEWED = "reviewed", "Reviewed"
        ACTIONED = "actioned", "Action Taken"
        DISMISSED = "dismissed", "Dismissed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_filed",
    )
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    content_type = models.CharField(
        max_length=20, choices=ReportContentType.choices
    )
    content_id = models.UUIDField()
    reason = models.TextField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.TextField(blank=True, default="")

    class Meta:
        db_table = "content_reports"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "content_type", "content_id"],
                name="unique_report_per_user_per_content",
            )
        ]

    def __str__(self):
        return f"{self.reporter} reported {self.content_type}:{self.content_id} ({self.report_type})"


class WantToTry(models.Model):
    """A venue the user wants to try in the future."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="want_to_try"
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="want_to_try"
    )
    note = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "want_to_try"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "venue"],
                name="uq_want_to_try_user_venue",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} wants to try {self.venue}"

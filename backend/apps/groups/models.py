import secrets
import string
import uuid

from django.conf import settings
from django.db import models


def generate_share_code():
    """Generate a unique 8-character alphanumeric share code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


class DinnerPlan(models.Model):
    """A group dinner plan that friends can vote on venues for."""

    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("voting", "Voting"),
        ("decided", "Decided"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_dinner_plans",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planning")
    share_code = models.CharField(max_length=8, unique=True, default=generate_share_code)
    selected_venue = models.ForeignKey(
        "venues.Venue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_dinner_plans",
    )
    vote_deadline = models.DateTimeField(null=True, blank=True)
    suggested_date = models.DateField(null=True, blank=True)
    suggested_time = models.TimeField(null=True, blank=True)
    max_venues = models.PositiveIntegerField(default=10)
    cuisine_filter = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dinner_plans"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"


class DinnerPlanMember(models.Model):
    """A member of a dinner plan group."""

    ROLE_CHOICES = [
        ("host", "Host"),
        ("member", "Member"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(
        DinnerPlan, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dinner_plan_memberships",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    has_voted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dinner_plan_members"
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "user"],
                name="uq_dinner_plan_member",
            ),
        ]

    def __str__(self):
        return f"{self.user} in {self.plan.title} ({self.role})"


class DinnerPlanVenue(models.Model):
    """A venue option within a dinner plan for voting."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(
        DinnerPlan, on_delete=models.CASCADE, related_name="venue_options"
    )
    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.CASCADE, related_name="dinner_plan_options"
    )
    total_yes = models.PositiveIntegerField(default=0)
    total_no = models.PositiveIntegerField(default=0)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "dinner_plan_venues"
        ordering = ["sort_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "venue"],
                name="uq_dinner_plan_venue",
            ),
        ]

    def __str__(self):
        return f"{self.venue.name} in {self.plan.title}"


class DinnerPlanVote(models.Model):
    """A user's vote on a venue option in a dinner plan."""

    VOTE_CHOICES = [
        ("yes", "Yes"),
        ("no", "No"),
        ("skip", "Skip"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan_venue = models.ForeignKey(
        DinnerPlanVenue, on_delete=models.CASCADE, related_name="votes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dinner_plan_votes",
    )
    vote = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dinner_plan_votes"
        constraints = [
            models.UniqueConstraint(
                fields=["plan_venue", "user"],
                name="uq_dinner_plan_vote",
            ),
        ]

    def __str__(self):
        return f"{self.user} voted {self.vote} on {self.plan_venue.venue.name}"

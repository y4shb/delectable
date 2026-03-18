"""
Compute and store periodic rating snapshots for venue and dish timelines.

Usage:
    python manage.py compute_rating_snapshots
    python manage.py compute_rating_snapshots --period month
    python manage.py compute_rating_snapshots --period week --months 6
    python manage.py compute_rating_snapshots --clear
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Avg, Count, Max, Min
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone

from apps.reviews.models import Review
from apps.venues.models import Dish, Venue, VenueRatingSnapshot


class Command(BaseCommand):
    help = "Compute and store rating snapshots for timeline visualization"

    def add_arguments(self, parser):
        parser.add_argument(
            "--period",
            choices=["week", "month"],
            default="month",
            help="Snapshot period type (default: month)",
        )
        parser.add_argument(
            "--months",
            type=int,
            default=24,
            help="How many months of history to compute (default: 24)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing snapshots before computing",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        period = options["period"]
        months = options["months"]
        trunc_fn = TruncWeek if period == "week" else TruncMonth

        if options["clear"]:
            deleted, _ = VenueRatingSnapshot.objects.filter(
                period_type=period
            ).delete()
            self.stdout.write(f"  Cleared {deleted} existing {period} snapshots")

        since = timezone.now() - timedelta(days=months * 30)

        # --- Venue-level snapshots (dish=NULL) ---
        venue_count = 0
        venues = Venue.objects.filter(
            reviews__created_at__gte=since
        ).distinct()

        for venue in venues:
            aggregated = (
                Review.objects.filter(venue=venue, created_at__gte=since)
                .annotate(period_start=trunc_fn("created_at"))
                .values("period_start")
                .annotate(
                    avg_rating=Avg("rating"),
                    review_count=Count("id"),
                    min_rating=Min("rating"),
                    max_rating=Max("rating"),
                )
                .order_by("period_start")
            )

            for row in aggregated:
                VenueRatingSnapshot.objects.update_or_create(
                    venue=venue,
                    dish=None,
                    period_start=row["period_start"],
                    period_type=period,
                    defaults={
                        "avg_rating": row["avg_rating"],
                        "review_count": row["review_count"],
                        "min_rating": row["min_rating"],
                        "max_rating": row["max_rating"],
                    },
                )
                venue_count += 1

        self.stdout.write(f"  Venue snapshots: {venue_count}")

        # --- Dish-level snapshots ---
        dish_count = 0
        dishes = Dish.objects.filter(
            reviews__created_at__gte=since
        ).select_related("venue").distinct()

        for dish in dishes:
            aggregated = (
                Review.objects.filter(dish=dish, created_at__gte=since)
                .annotate(period_start=trunc_fn("created_at"))
                .values("period_start")
                .annotate(
                    avg_rating=Avg("rating"),
                    review_count=Count("id"),
                    min_rating=Min("rating"),
                    max_rating=Max("rating"),
                )
                .order_by("period_start")
            )

            for row in aggregated:
                VenueRatingSnapshot.objects.update_or_create(
                    venue=dish.venue,
                    dish=dish,
                    period_start=row["period_start"],
                    period_type=period,
                    defaults={
                        "avg_rating": row["avg_rating"],
                        "review_count": row["review_count"],
                        "min_rating": row["min_rating"],
                        "max_rating": row["max_rating"],
                    },
                )
                dish_count += 1

        self.stdout.write(f"  Dish snapshots: {dish_count}")

        total = venue_count + dish_count
        self.stdout.write(
            self.style.SUCCESS(f"\nComputed {total} {period} snapshots.")
        )

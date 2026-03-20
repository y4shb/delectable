"""Celery tasks for the venues app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    acks_late=True,
)
def refresh_venue_similarity(self):
    """Recompute venue similarity scores based on shared reviewers and tags.

    Runs daily at 3 AM UTC via Celery Beat. For each pair of venues that
    share at least one reviewer, computes a similarity score using
    Jaccard similarity on reviewer sets and tag overlap.
    """
    from collections import defaultdict

    from django.db.models import Count

    from apps.reviews.models import Review
    from apps.venues.models import Venue, VenueSimilarity

    try:
        # Only consider venues with enough reviews for meaningful similarity
        active_venue_ids = list(
            Venue.objects.filter(reviews_count__gte=3)
            .values_list("id", flat=True)
        )

        if not active_venue_ids:
            logger.info("No active venues for similarity computation")
            return {"status": "skipped", "reason": "no_active_venues"}

        # Build reviewer-to-venues mapping
        reviewer_venues = defaultdict(set)
        reviews = Review.objects.filter(
            venue_id__in=active_venue_ids,
        ).values_list("user_id", "venue_id")

        for user_id, venue_id in reviews:
            reviewer_venues[user_id].add(venue_id)

        # Build venue-to-reviewers mapping
        venue_reviewers = defaultdict(set)
        for user_id, venues in reviewer_venues.items():
            for venue_id in venues:
                venue_reviewers[venue_id].add(user_id)

        # Build venue-to-tags mapping
        venue_tags = {}
        for venue in Venue.objects.filter(id__in=active_venue_ids).values("id", "tags", "cuisine_type"):
            tags = set(venue["tags"] or [])
            if venue["cuisine_type"]:
                tags.add(venue["cuisine_type"].lower())
            venue_tags[venue["id"]] = tags

        # Compute pairwise similarity for venues sharing reviewers
        pairs_computed = 0
        similarity_objects = []

        venue_list = list(venue_reviewers.keys())
        for i, venue_a_id in enumerate(venue_list):
            reviewers_a = venue_reviewers[venue_a_id]
            tags_a = venue_tags.get(venue_a_id, set())

            for venue_b_id in venue_list[i + 1:]:
                reviewers_b = venue_reviewers[venue_b_id]

                # Jaccard similarity on reviewer sets
                intersection = len(reviewers_a & reviewers_b)
                if intersection == 0:
                    continue

                union = len(reviewers_a | reviewers_b)
                reviewer_sim = intersection / union if union > 0 else 0.0

                # Tag overlap bonus
                tags_b = venue_tags.get(venue_b_id, set())
                tag_intersection = len(tags_a & tags_b)
                tag_union = len(tags_a | tags_b)
                tag_sim = tag_intersection / tag_union if tag_union > 0 else 0.0

                # Combined score: 70% reviewer overlap, 30% tag overlap
                score = 0.7 * reviewer_sim + 0.3 * tag_sim

                if score >= 0.05:  # Only store meaningful similarities
                    similarity_objects.append(
                        VenueSimilarity(
                            venue_a_id=venue_a_id,
                            venue_b_id=venue_b_id,
                            score=round(score, 4),
                        )
                    )
                    pairs_computed += 1

        # Bulk upsert
        if similarity_objects:
            VenueSimilarity.objects.bulk_create(
                similarity_objects,
                update_conflicts=True,
                update_fields=["score", "computed_at"],
                unique_fields=["venue_a", "venue_b"],
            )

        logger.info(
            "Venue similarity refresh complete: %d pairs computed across %d venues",
            pairs_computed,
            len(active_venue_ids),
        )
        return {"status": "success", "pairs": pairs_computed, "venues": len(active_venue_ids)}

    except Exception as exc:
        logger.error("Failed to refresh venue similarity: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def compute_rating_snapshots(self):
    """Create periodic rating snapshots for all active venues.

    Runs daily at 4 AM UTC via Celery Beat. Generates weekly and monthly
    snapshots of average ratings and review counts for trend visualization.
    """
    from datetime import timedelta

    from django.db.models import Avg, Count, Max, Min
    from django.utils import timezone

    from apps.reviews.models import Review
    from apps.venues.models import Venue, VenueRatingSnapshot

    now = timezone.now()
    today = now.date()

    try:
        # Weekly snapshot: last 7 days
        week_start = today - timedelta(days=7)
        active_venues = Venue.objects.filter(reviews_count__gte=1)

        snapshot_count = 0

        for venue in active_venues.iterator():
            # Weekly stats
            weekly_stats = Review.objects.filter(
                venue=venue,
                created_at__date__gte=week_start,
                created_at__date__lt=today,
            ).aggregate(
                avg_rating=Avg("rating"),
                review_count=Count("id"),
                min_rating=Min("rating"),
                max_rating=Max("rating"),
            )

            if weekly_stats["review_count"] and weekly_stats["review_count"] > 0:
                VenueRatingSnapshot.objects.update_or_create(
                    venue=venue,
                    dish=None,
                    period_start=week_start,
                    period_type="week",
                    defaults={
                        "avg_rating": weekly_stats["avg_rating"],
                        "review_count": weekly_stats["review_count"],
                        "min_rating": weekly_stats["min_rating"],
                        "max_rating": weekly_stats["max_rating"],
                    },
                )
                snapshot_count += 1

            # Monthly snapshot (only on the 1st of the month)
            if today.day == 1:
                month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
                month_end = today - timedelta(days=1)

                monthly_stats = Review.objects.filter(
                    venue=venue,
                    created_at__date__gte=month_start,
                    created_at__date__lte=month_end,
                ).aggregate(
                    avg_rating=Avg("rating"),
                    review_count=Count("id"),
                    min_rating=Min("rating"),
                    max_rating=Max("rating"),
                )

                if monthly_stats["review_count"] and monthly_stats["review_count"] > 0:
                    VenueRatingSnapshot.objects.update_or_create(
                        venue=venue,
                        dish=None,
                        period_start=month_start,
                        period_type="month",
                        defaults={
                            "avg_rating": monthly_stats["avg_rating"],
                            "review_count": monthly_stats["review_count"],
                            "min_rating": monthly_stats["min_rating"],
                            "max_rating": monthly_stats["max_rating"],
                        },
                    )
                    snapshot_count += 1

        logger.info("Rating snapshots computed: %d snapshots created", snapshot_count)
        return {"status": "success", "snapshots": snapshot_count}

    except Exception as exc:
        logger.error("Failed to compute rating snapshots: %s", exc)
        raise self.retry(exc=exc)

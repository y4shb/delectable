"""Celery tasks for the feed app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def recompute_trending(self):
    """Recompute trending venue scores.

    Runs every 30 minutes via Celery Beat. Replaces the in-process
    background-thread approach in the feed engine with a proper
    distributed task.
    """
    from apps.feed.engine import compute_trending_scores

    try:
        compute_trending_scores()
        logger.info("Trending scores recomputed successfully")
        return {"status": "success"}
    except Exception as exc:
        logger.error("Failed to recompute trending scores: %s", exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=120,
    acks_late=True,
)
def precompute_feed_scores(self, user_id):
    """Pre-compute and cache feed scores for a specific user.

    Triggered after significant user activity (new follow, new review)
    so the next feed request is fast.
    """
    from django.contrib.auth import get_user_model

    from apps.feed.engine import (
        _precompute_viewer_preference_data,
        batch_precompute_social_scores,
        get_engagement_percentiles,
    )
    from apps.users.models import Follow

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id, is_active=True)
    except User.DoesNotExist:
        logger.warning("User %s not found for feed pre-computation", user_id)
        return {"status": "skipped", "reason": "user_not_found"}

    try:
        # Pre-compute social affinity scores for all followed users
        following_ids = list(
            Follow.objects.filter(follower=user).values_list(
                "following_id", flat=True
            )
        )
        if following_ids:
            authors = User.objects.filter(id__in=following_ids)
            batch_precompute_social_scores(user, authors)

        # Pre-compute engagement percentiles (shared across users)
        get_engagement_percentiles()

        # Pre-compute viewer preference data
        _precompute_viewer_preference_data(user)

        logger.info("Feed scores pre-computed for user %s", user_id)
        return {"status": "success", "following_count": len(following_ids)}

    except Exception as exc:
        logger.error(
            "Failed to pre-compute feed scores for user %s: %s",
            user_id,
            exc,
        )
        raise self.retry(exc=exc)

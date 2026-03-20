"""Celery tasks for the reviews app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def compute_quality_score_async(self, review_id):
    """Compute and persist the quality score for a review.

    Called after review creation or update to offload the scoring
    computation from the request cycle.
    """
    from apps.feed.engine import compute_quality_score
    from apps.reviews.models import Review

    try:
        review = Review.objects.select_related("venue").get(id=review_id)
    except Review.DoesNotExist:
        logger.warning("Review %s not found for quality scoring", review_id)
        return {"status": "skipped", "reason": "not_found"}

    try:
        score = compute_quality_score(review)
        Review.objects.filter(id=review_id).update(quality_score=score)

        logger.info(
            "Quality score for review %s: %.3f",
            review_id,
            score,
        )
        return {
            "status": "success",
            "review_id": str(review_id),
            "quality_score": score,
        }

    except Exception as exc:
        logger.error(
            "Failed to compute quality score for review %s: %s",
            review_id,
            exc,
        )
        raise self.retry(exc=exc)

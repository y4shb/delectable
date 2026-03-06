"""Signals for maintaining denormalized counters on cascade deletes.

When a User or Review is deleted, Django cascades deletes to ReviewLike,
Comment, Bookmark, etc. The views handle counter updates for explicit
actions (like/unlike), but cascade deletes bypass them. These signals
serve as safety nets to keep counts consistent.
"""

from django.db.models import F
from django.db.models.functions import Greatest
from django.db.models.signals import post_delete
from django.dispatch import receiver

from apps.users.models import Follow, User

from .models import Comment, Review, ReviewLike


@receiver(post_delete, sender=ReviewLike)
def reviewlike_post_delete(sender, instance, **kwargs):
    """Decrement review.like_count when a ReviewLike is cascade-deleted."""
    Review.objects.filter(id=instance.review_id).update(
        like_count=Greatest(F("like_count") - 1, 0)
    )


@receiver(post_delete, sender=Comment)
def comment_post_delete(sender, instance, **kwargs):
    """Decrement review.comment_count when a Comment is cascade-deleted."""
    Review.objects.filter(id=instance.review_id).update(
        comment_count=Greatest(F("comment_count") - 1, 0)
    )


@receiver(post_delete, sender=Follow)
def follow_post_delete(sender, instance, **kwargs):
    """Decrement follower/following counts when a Follow is cascade-deleted."""
    from django.db.models.functions import Greatest

    User.objects.filter(id=instance.follower_id).update(
        following_count=Greatest(F("following_count") - 1, 0)
    )
    User.objects.filter(id=instance.following_id).update(
        followers_count=Greatest(F("followers_count") - 1, 0)
    )

"""ML services for recommendations, authenticity scoring, and trending detection."""

import hashlib
import re
from datetime import timedelta
from typing import Optional

from django.db.models import Avg, Count, F, Q
from django.utils import timezone

from apps.reviews.models import Review
from apps.venues.models import Venue

from .models import ReviewAuthenticity, TrendingItem, VenueRecommendation


# ---------------------------------------------------------------------------
# Review Authenticity Scoring
# ---------------------------------------------------------------------------


def score_review_authenticity(review: Review) -> float:
    """
    Score a review for authenticity using heuristic-based approach.
    Returns score from 0 (likely fake) to 1 (likely authentic).

    In production, this would use a fine-tuned DistilBERT model.
    """
    score = 0.5  # Base score
    flags = []

    text = review.text or ""

    # Positive signals
    if len(text) > 50:
        score += 0.1
    if len(text) > 150:
        score += 0.1

    if review.photo_url:
        score += 0.15

    if review.dish_name:
        score += 0.05

    # Check for specific details (numbers, prices, dishes)
    if re.search(r'\$\d+', text) or re.search(r'\d+ (minutes|mins)', text):
        score += 0.1

    # Negative signals
    # Excessive caps
    if text.isupper() and len(text) > 20:
        score -= 0.2
        flags.append("excessive_caps")

    # Very short generic review
    if len(text) < 20 and review.rating in [1, 5]:
        score -= 0.15
        flags.append("short_extreme_rating")

    # Suspicious patterns
    spam_patterns = [
        r'(best|worst|amazing|terrible) ever',
        r'(definitely|highly) recommend',
        r'you (must|should) (try|visit)',
    ]
    spam_count = sum(1 for p in spam_patterns if re.search(p, text.lower()))
    if spam_count >= 2:
        score -= 0.1
        flags.append("promotional_language")

    # User history bonus
    user_review_count = Review.objects.filter(user=review.user).count()
    if user_review_count > 5:
        score += 0.1
    if user_review_count > 20:
        score += 0.05

    # Clamp score
    score = max(0.0, min(1.0, score))

    # Save authenticity record
    ReviewAuthenticity.objects.update_or_create(
        review=review,
        defaults={
            "authenticity_score": score,
            "is_trusted": score >= 0.5,
            "flags": flags,
        },
    )

    return score


# ---------------------------------------------------------------------------
# Venue Ranking Algorithm
# ---------------------------------------------------------------------------


def compute_venue_ranking_score(venue: Venue, user=None) -> float:
    """
    Compute a hybrid ranking score for a venue.
    Combines collaborative filtering + content-based signals.
    """
    score = 0.0

    # Base quality: rating + review count
    score += float(venue.rating or 0) * 0.2
    score += min(venue.reviews_count / 100, 0.2)  # Cap at 0.2

    # Recency: recent reviews boost
    recent_reviews = Review.objects.filter(
        venue=venue,
        created_at__gte=timezone.now() - timedelta(days=30),
    ).count()
    score += min(recent_reviews / 10, 0.15)

    # Engagement: likes and comments
    engagement = Review.objects.filter(venue=venue).aggregate(
        total_likes=Avg("like_count"),
        total_comments=Avg("comment_count"),
    )
    avg_likes = engagement["total_likes"] or 0
    avg_comments = engagement["total_comments"] or 0
    score += min(avg_likes / 20, 0.1)
    score += min(avg_comments / 10, 0.1)

    # Photo presence
    photo_reviews = Review.objects.filter(
        venue=venue, photo_url__isnull=False
    ).exclude(photo_url="").count()
    score += min(photo_reviews / venue.reviews_count, 0.1) if venue.reviews_count > 0 else 0

    # User personalization (if user provided)
    if user:
        personalization = compute_user_venue_affinity(user, venue)
        score += personalization * 0.25

    return min(score, 1.0)


def compute_user_venue_affinity(user, venue: Venue) -> float:
    """Compute affinity between user and venue based on preferences."""
    affinity = 0.0

    # Cuisine match
    user_cuisines = getattr(user, "favorite_cuisines", []) or []
    if venue.cuisine_type and venue.cuisine_type.lower() in [c.lower() for c in user_cuisines]:
        affinity += 0.4

    # Tag overlap
    from apps.feed.models import UserTasteProfile
    try:
        profile = UserTasteProfile.objects.get(user=user)
        user_tags = set(profile.preferred_cuisines or [])
        venue_tags = set(venue.tags or [])
        overlap = len(user_tags & venue_tags) / max(len(user_tags | venue_tags), 1)
        affinity += overlap * 0.3
    except UserTasteProfile.DoesNotExist:
        pass

    # Friend activity
    from apps.users.models import Follow
    following_ids = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    friend_reviews = Review.objects.filter(user_id__in=following_ids, venue=venue).count()
    affinity += min(friend_reviews / 5, 0.3)

    return min(affinity, 1.0)


# ---------------------------------------------------------------------------
# Personalized Recommendations
# ---------------------------------------------------------------------------


def generate_recommendations(user, limit: int = 20) -> list:
    """Generate personalized venue recommendations for a user."""
    # Get venues the user hasn't reviewed
    reviewed_venue_ids = Review.objects.filter(user=user).values_list("venue_id", flat=True)

    candidates = Venue.objects.exclude(id__in=reviewed_venue_ids).prefetch_related('reviews').order_by("-rating")[:200]

    recommendations = []
    for venue in candidates:
        score = compute_venue_ranking_score(venue, user)
        reason = generate_recommendation_reason(user, venue)
        recommendations.append({
            "venue": venue,
            "score": score,
            "reason": reason["text"],
            "reason_type": reason["type"],
        })

    # Sort by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    # Cache recommendations
    VenueRecommendation.objects.filter(user=user).delete()
    for rec in recommendations[:limit]:
        VenueRecommendation.objects.create(
            user=user,
            venue=rec["venue"],
            score=rec["score"],
            reason=rec["reason"],
            reason_type=rec["reason_type"],
        )

    return recommendations[:limit]


def generate_recommendation_reason(user, venue: Venue) -> dict:
    """Generate a human-readable explanation for why a venue is recommended."""
    # Check friend activity
    from apps.users.models import Follow
    following_ids = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    friend_reviews = Review.objects.filter(
        user_id__in=following_ids, venue=venue
    ).select_related("user")[:3]

    if friend_reviews:
        names = [r.user.name for r in friend_reviews[:2]]
        if len(names) == 1:
            return {"type": "friend", "text": f"Reviewed by {names[0]}"}
        return {"type": "friend", "text": f"Reviewed by {names[0]} and {len(friend_reviews) - 1} others"}

    # Check cuisine match
    user_cuisines = getattr(user, "favorite_cuisines", []) or []
    if venue.cuisine_type and venue.cuisine_type.lower() in [c.lower() for c in user_cuisines]:
        return {"type": "cuisine", "text": f"Matches your love of {venue.cuisine_type}"}

    # High rating
    if venue.rating >= 4.5:
        return {"type": "rating", "text": f"Highly rated ({venue.rating:.1f})"}

    # Popular
    if venue.reviews_count >= 50:
        return {"type": "popular", "text": f"Popular spot with {venue.reviews_count} reviews"}

    return {"type": "discover", "text": "Recommended for you"}


# ---------------------------------------------------------------------------
# Trending Detection
# ---------------------------------------------------------------------------


def detect_trending_items(region: str = "") -> list:
    """Detect trending venues and dishes."""
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    trending = []

    # Venue trending based on review velocity
    venues = Venue.objects.annotate(
        recent_reviews=Count(
            "reviews",
            filter=Q(reviews__created_at__gte=week_ago),
        ),
        previous_reviews=Count(
            "reviews",
            filter=Q(
                reviews__created_at__gte=two_weeks_ago,
                reviews__created_at__lt=week_ago,
            ),
        ),
    ).filter(recent_reviews__gt=0)

    for venue in venues:
        velocity = venue.recent_reviews - venue.previous_reviews
        if velocity > 0 and venue.recent_reviews >= 3:
            trend_score = (velocity / max(venue.previous_reviews, 1)) * venue.recent_reviews
            trending.append({
                "item_type": TrendingItem.ItemType.VENUE,
                "item_id": venue.id,
                "item_name": venue.name,
                "trend_score": trend_score,
                "velocity": velocity,
                "explanation": f"+{velocity} reviews this week",
            })

    # Sort and limit
    trending.sort(key=lambda x: x["trend_score"], reverse=True)
    trending = trending[:20]

    # Save to database
    TrendingItem.objects.filter(expires_at__lt=now).delete()
    for item in trending:
        TrendingItem.objects.update_or_create(
            item_type=item["item_type"],
            item_id=item["item_id"],
            defaults={
                "item_name": item["item_name"],
                "trend_score": item["trend_score"],
                "velocity": item["velocity"],
                "explanation": item["explanation"],
                "region": region,
                "expires_at": now + timedelta(hours=6),
            },
        )

    return trending


# ---------------------------------------------------------------------------
# ML Feed Scoring
# ---------------------------------------------------------------------------


def score_feed_for_user(reviews, user) -> list:
    """Score and rank feed items for a user using ML signals."""
    scored_reviews = []

    for review in reviews:
        score = 0.0

        # Base: EdgeRank-style scoring (already computed)
        score += review.quality_score * 0.3 if hasattr(review, "quality_score") else 0.2

        # Authenticity boost for trusted reviews
        try:
            auth = ReviewAuthenticity.objects.get(review=review)
            if auth.is_trusted:
                score += 0.15
        except ReviewAuthenticity.DoesNotExist:
            pass

        # Affinity with reviewer
        from apps.feed.models import UserAffinity
        try:
            affinity = UserAffinity.objects.get(user=user, target_user=review.user)
            score += affinity.score * 0.25
        except UserAffinity.DoesNotExist:
            pass

        # Venue relevance
        if hasattr(review, "venue"):
            venue_affinity = compute_user_venue_affinity(user, review.venue)
            score += venue_affinity * 0.2

        # Recency
        age_hours = (timezone.now() - review.created_at).total_seconds() / 3600
        recency_factor = 1 / (1 + age_hours / 24)
        score += recency_factor * 0.1

        scored_reviews.append({
            "review": review,
            "ml_score": score,
        })

    # Sort by ML score
    scored_reviews.sort(key=lambda x: x["ml_score"], reverse=True)

    return scored_reviews

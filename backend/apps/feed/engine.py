"""Feed Intelligence Engine — scoring, trending, cold-start, and diversity."""

import math
from collections import defaultdict
from datetime import timedelta

from django.db.models import Avg, Count, F, Q
from django.utils import timezone

from apps.reviews.models import Bookmark, Review, ReviewLike
from apps.users.models import Follow, User
from apps.venues.models import Venue

from .models import UserAffinity, UserTasteProfile, VenueTrendingScore


# ---------------------------------------------------------------------------
# 6.1 Quality Score — precomputed on review save
# ---------------------------------------------------------------------------

def compute_quality_score(review):
    """Compute review quality score (0-1) based on content signals."""
    text = review.text or ""
    score = 0.0
    # Has photo (+0.3)
    if review.photo_url:
        score += 0.3
    # Text length > 100 chars (+0.2)
    if len(text) > 100:
        score += 0.2
    elif len(text) > 50:
        score += 0.1
    # Specific rating — not rounded to whole number (+0.1)
    rating_f = float(review.rating)
    if abs(rating_f - round(rating_f)) > 1e-9:
        score += 0.1
    # Has 2+ tags (+0.1)
    if review.tags and len(review.tags) >= 2:
        score += 0.1
    # Has dish name (+0.1)
    if review.dish_name:
        score += 0.1
    # Text contains substance — more than just a few words (+0.2)
    word_count = len(text.split())
    if word_count >= 20:
        score += 0.2
    elif word_count >= 10:
        score += 0.1
    return min(score, 1.0)


# ---------------------------------------------------------------------------
# 6.1 Social Signal — affinity between viewer and author
# ---------------------------------------------------------------------------

def get_social_score(viewer, author):
    """Compute social signal score (0-1) for viewer→author relationship."""
    if viewer.id == author.id:
        return 1.0

    # Check cache first
    affinity = UserAffinity.objects.filter(user=viewer, target=author).first()
    if affinity and (timezone.now() - affinity.updated_at) < timedelta(hours=1):
        return affinity.score

    # Compute fresh
    is_following = Follow.objects.filter(follower=viewer, following=author).exists()
    if not is_following:
        return 0.0

    # Interaction frequency: likes + comments on author's reviews
    like_count = ReviewLike.objects.filter(
        user=viewer, review__user=author
    ).count()
    from apps.reviews.models import Comment
    comment_count = Comment.objects.filter(
        user=viewer, review__user=author
    ).count()
    interaction_count = like_count + comment_count
    interaction_score = min(interaction_count / 10, 1.0)  # Cap at 10 interactions

    # Mutual follow bonus
    has_mutual = Follow.objects.filter(follower=author, following=viewer).exists()
    mutual_bonus = 0.2 if has_mutual else 0.0

    score = min(1.0, 0.5 + 0.3 * interaction_score + mutual_bonus)

    # Cache it
    UserAffinity.objects.update_or_create(
        user=viewer,
        target=author,
        defaults={
            "is_following": is_following,
            "interaction_count": interaction_count,
            "has_mutual_follow": has_mutual,
            "score": score,
        },
    )

    return score


def batch_precompute_social_scores(viewer, authors):
    """Batch-precompute social scores for multiple authors at once.

    Returns a dict of {author_id: score}. Avoids N+1 queries by fetching
    all affinities, follows, likes, comments, and mutual follows in bulk.
    """
    from apps.reviews.models import Comment

    now = timezone.now()
    author_ids = {a.id for a in authors if a.id != viewer.id}
    if not author_ids:
        return {viewer.id: 1.0}

    scores = {viewer.id: 1.0}

    # Batch fetch cached affinities
    cached_affinities = {
        a.target_id: a
        for a in UserAffinity.objects.filter(user=viewer, target_id__in=author_ids)
    }

    # Determine which need fresh computation
    stale_ids = set()
    for aid in author_ids:
        aff = cached_affinities.get(aid)
        if aff and (now - aff.updated_at) < timedelta(hours=1):
            scores[aid] = aff.score
        else:
            stale_ids.add(aid)

    if not stale_ids:
        return scores

    # Batch fetch follows (viewer → stale authors)
    following_set = set(
        Follow.objects.filter(
            follower=viewer, following_id__in=stale_ids
        ).values_list("following_id", flat=True)
    )

    # Authors not followed get 0
    for aid in stale_ids - following_set:
        scores[aid] = 0.0

    followed_ids = stale_ids & following_set
    if not followed_ids:
        return scores

    # Batch fetch interaction counts (likes)
    like_counts = dict(
        ReviewLike.objects.filter(
            user=viewer, review__user_id__in=followed_ids
        ).values("review__user_id").annotate(cnt=Count("id")).values_list("review__user_id", "cnt")
    )

    # Batch fetch interaction counts (comments)
    comment_counts = dict(
        Comment.objects.filter(
            user=viewer, review__user_id__in=followed_ids
        ).values("review__user_id").annotate(cnt=Count("id")).values_list("review__user_id", "cnt")
    )

    # Batch fetch mutual follows (authors → viewer)
    mutual_set = set(
        Follow.objects.filter(
            follower_id__in=followed_ids, following=viewer
        ).values_list("follower_id", flat=True)
    )

    # Compute and cache scores
    affinity_objects = []
    for aid in followed_ids:
        interaction_count = like_counts.get(aid, 0) + comment_counts.get(aid, 0)
        interaction_score = min(interaction_count / 10, 1.0)
        has_mutual = aid in mutual_set
        mutual_bonus = 0.2 if has_mutual else 0.0
        score = min(1.0, 0.5 + 0.3 * interaction_score + mutual_bonus)
        scores[aid] = score

        affinity_objects.append(
            UserAffinity(
                user=viewer,
                target_id=aid,
                is_following=True,
                interaction_count=interaction_count,
                has_mutual_follow=has_mutual,
                score=score,
            )
        )

    if affinity_objects:
        UserAffinity.objects.bulk_create(
            affinity_objects,
            update_conflicts=True,
            update_fields=["is_following", "interaction_count", "has_mutual_follow", "score"],
            unique_fields=["user", "target"],
        )

    return scores


# ---------------------------------------------------------------------------
# 6.1 Engagement Signal — normalized engagement metrics
# ---------------------------------------------------------------------------

def get_engagement_score(review, percentile_95_likes=10, percentile_95_comments=5):
    """Compute engagement signal (0-1) using log-scaled, capped metrics."""
    # Log-scale and normalize against 95th percentile
    like_norm = min(math.log1p(review.like_count) / math.log1p(percentile_95_likes), 1.0)
    comment_norm = min(math.log1p(review.comment_count) / math.log1p(percentile_95_comments), 1.0)
    # Prefer annotated bookmark_count to avoid an extra query per review.
    if hasattr(review, 'bookmark_count'):
        bookmark_count = review.bookmark_count
    elif hasattr(review, 'bookmarks'):
        bookmark_count = review.bookmarks.count()
    else:
        bookmark_count = 0
    bookmark_norm = min(math.log1p(bookmark_count) / math.log1p(5), 1.0)

    return 0.4 * like_norm + 0.35 * comment_norm + 0.25 * bookmark_norm


# ---------------------------------------------------------------------------
# 6.1 Preference Signal — cuisine/taste alignment
# ---------------------------------------------------------------------------

def get_preference_score(viewer, review, viewer_tags=None, viewer_avg_rating=None):
    """Compute preference alignment (0-1) between viewer's taste and review content.

    Accepts optional pre-computed viewer_tags and viewer_avg_rating to avoid
    repeated queries when called in a loop.
    """
    score = 0.0

    # Cuisine match
    fav_cuisines = set(viewer.favorite_cuisines or [])
    venue = review.venue
    if venue.cuisine_type and fav_cuisines:
        if venue.cuisine_type.lower() in {c.lower() for c in fav_cuisines}:
            score += 0.5

    # Tag overlap with viewer's preferred tags (from their own reviews)
    if review.tags:
        if viewer_tags is None:
            viewer_tags = set()
            for r in Review.objects.filter(user=viewer).values_list("tags", flat=True)[:20]:
                if r:
                    viewer_tags.update(r)
        if viewer_tags:
            overlap = len(set(review.tags) & viewer_tags) / max(len(review.tags), 1)
            score += 0.3 * overlap

    # Rating alignment — reviewer rates similarly to viewer's average
    if viewer_avg_rating is None:
        viewer_avg_rating = Review.objects.filter(user=viewer).aggregate(avg=Avg("rating"))["avg"]
    if viewer_avg_rating:
        diff = abs(float(review.rating) - float(viewer_avg_rating))
        alignment = max(0, 1 - diff / 5)  # 0-1 scale
        score += 0.2 * alignment

    return min(score, 1.0)


# ---------------------------------------------------------------------------
# 6.1 Full EdgeRank Feed Score
# ---------------------------------------------------------------------------

def _precompute_viewer_preference_data(viewer):
    """Pre-compute viewer tags and average rating for preference scoring."""
    viewer_tags = set()
    for r in Review.objects.filter(user=viewer).values_list("tags", flat=True)[:20]:
        if r:
            viewer_tags.update(r)
    viewer_avg_rating = Review.objects.filter(user=viewer).aggregate(avg=Avg("rating"))["avg"]
    return viewer_tags, viewer_avg_rating


def compute_feed_score(review, viewer, engagement_percentiles=None, viewer_tags=None, viewer_avg_rating=None, social_scores=None):
    """Compute EdgeRank-style feed score for a review from viewer's perspective.

    Accepts optional social_scores dict ({author_id: score}) from
    batch_precompute_social_scores() to avoid per-review affinity queries.
    """
    if social_scores is not None:
        social = social_scores.get(review.user_id, 0.0)
    else:
        social = get_social_score(viewer, review.user)
    engagement = get_engagement_score(
        review,
        percentile_95_likes=engagement_percentiles.get("likes", 10) if engagement_percentiles else 10,
        percentile_95_comments=engagement_percentiles.get("comments", 5) if engagement_percentiles else 5,
    )
    preference = get_preference_score(viewer, review, viewer_tags=viewer_tags, viewer_avg_rating=viewer_avg_rating)
    quality = review.quality_score

    raw_score = (
        0.30 * social
        + 0.25 * engagement
        + 0.25 * preference
        + 0.20 * quality
    )

    # Time decay
    age_hours = (timezone.now() - review.created_at).total_seconds() / 3600
    decay = (age_hours + 2) ** 1.5

    return raw_score / decay


def get_engagement_percentiles():
    """Get 95th percentile engagement values for normalization."""
    recent = Review.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    )
    likes = list(recent.values_list("like_count", flat=True))
    comments = list(recent.values_list("comment_count", flat=True))

    if len(likes) < 5:
        return {"likes": 10, "comments": 5}

    likes.sort()
    comments.sort()
    idx_95 = int(len(likes) * 0.95)

    return {
        "likes": max(likes[idx_95] if idx_95 < len(likes) else 10, 1),
        "comments": max(comments[idx_95] if idx_95 < len(comments) else 5, 1),
    }


# ---------------------------------------------------------------------------
# 6.2 Trending Detection
# ---------------------------------------------------------------------------

TRENDING_STALE_MINUTES = 30
_trending_computation_lock = False
_trending_thread = None


def compute_trending_scores():
    """Recompute trending scores for all venues with recent activity."""
    now = timezone.now()
    last_7d = now - timedelta(days=7)
    last_24h = now - timedelta(hours=24)
    last_30d = now - timedelta(days=30)

    # Get venues with at least 1 review in last 7 days
    active_venues = (
        Review.objects.filter(created_at__gte=last_7d)
        .values("venue_id")
        .annotate(recent_count=Count("id"))
        .filter(recent_count__gte=1)
    )

    # Baseline: 30-day average daily review count per venue
    baselines = {}
    baseline_qs = (
        Review.objects.filter(created_at__gte=last_30d)
        .values("venue_id")
        .annotate(total=Count("id"))
    )
    for row in baseline_qs:
        baselines[row["venue_id"]] = row["total"] / 30  # avg daily

    for row in active_venues:
        venue_id = row["venue_id"]
        recent_count = row["recent_count"]

        # Baseline stats
        baseline_avg = baselines.get(venue_id, 0.5)
        # Simple std estimate (use sqrt of mean as proxy for Poisson-like data)
        baseline_std = max(math.sqrt(baseline_avg), 0.5)

        # Z-score (use sqrt(7) * std for proper weekly aggregation of Poisson-like data)
        z = (recent_count - baseline_avg * 7) / max(baseline_std * math.sqrt(7), 1)

        # Velocity: last 24h reviews / 7d avg daily
        last_24h_count = Review.objects.filter(
            venue_id=venue_id, created_at__gte=last_24h
        ).count()
        velocity = last_24h_count / max(baseline_avg, 0.1)

        # Decay score: sum of exp(-0.1 * age_hours) for recent reviews
        recent_reviews = Review.objects.filter(
            venue_id=venue_id, created_at__gte=last_7d
        ).values_list("created_at", flat=True)
        decay_score = sum(
            math.exp(-0.1 * (now - dt).total_seconds() / 3600)
            for dt in recent_reviews
        )

        trending_score = 0.4 * max(z, 0) + 0.3 * velocity + 0.3 * decay_score

        VenueTrendingScore.objects.update_or_create(
            venue_id=venue_id,
            defaults={
                "score": trending_score,
                "review_velocity": velocity,
                "z_score": z,
            },
        )


def get_trending_venues(limit=10):
    """Get trending venues, recomputing if stale.

    Uses a background thread to avoid blocking the request and a simple
    lock to prevent thundering herd problem where multiple concurrent
    requests all trigger recomputation.
    """
    import threading

    global _trending_computation_lock, _trending_thread

    latest = VenueTrendingScore.objects.order_by("-computed_at").first()
    is_stale = not latest or (timezone.now() - latest.computed_at) > timedelta(minutes=TRENDING_STALE_MINUTES)

    if is_stale and not _trending_computation_lock:
        # If we have existing data, recompute in background thread
        if latest:
            def _recompute():
                global _trending_computation_lock
                try:
                    _trending_computation_lock = True
                    from django.db import connection
                    compute_trending_scores()
                    connection.close()
                finally:
                    _trending_computation_lock = False

            _trending_thread = threading.Thread(target=_recompute, daemon=True)
            _trending_thread.start()
        else:
            # First time ever — must compute synchronously
            try:
                _trending_computation_lock = True
                compute_trending_scores()
            finally:
                _trending_computation_lock = False

    return (
        VenueTrendingScore.objects.select_related("venue")
        .filter(score__gt=0)
        .order_by("-score")[:limit]
    )


# ---------------------------------------------------------------------------
# 6.2 Explore Feed Pipeline
# ---------------------------------------------------------------------------

def explore_feed(viewer, limit=20):
    """3-stage explore pipeline: candidate generation → scoring → diversity."""
    now = timezone.now()

    # Stage 1: Candidate generation
    following_ids = set(
        Follow.objects.filter(follower=viewer).values_list("following_id", flat=True)
    )
    candidates = (
        Review.objects.exclude(user=viewer)
        .exclude(user_id__in=following_ids)
        .filter(
            created_at__gte=now - timedelta(days=7),
            rating__gte=7.0,
        )
        .select_related("user", "venue")
        .annotate(bookmark_count=Count("bookmarks"))
        .order_by("-created_at")[:200]  # Cap candidates
    )

    if not candidates:
        # Fallback: popular recent reviews from anyone (exclude viewer's own)
        candidates = (
            Review.objects.filter(created_at__gte=now - timedelta(days=14))
            .exclude(user=viewer)
            .select_related("user", "venue")
            .annotate(bookmark_count=Count("bookmarks"))
            .order_by("-like_count", "-created_at")[:50]
        )

    # Stage 2: Scoring (replace Social with Discovery signal)
    engagement_pcts = get_engagement_percentiles()
    trending_map = {
        ts.venue_id: ts.score
        for ts in VenueTrendingScore.objects.filter(score__gt=0)
    }

    # Pre-compute viewer preference data once (fixes N+1 query)
    viewer_tags, viewer_avg_rating = _precompute_viewer_preference_data(viewer)

    scored = []
    for review in candidates:
        engagement = get_engagement_score(review, **{
            "percentile_95_likes": engagement_pcts["likes"],
            "percentile_95_comments": engagement_pcts["comments"],
        })
        preference = get_preference_score(viewer, review, viewer_tags=viewer_tags, viewer_avg_rating=viewer_avg_rating)
        quality = review.quality_score

        # Discovery signal instead of Social
        trending_boost = min(trending_map.get(review.venue_id, 0) / 10, 1.0)
        discovery = 0.5 + 0.5 * trending_boost

        raw_score = (
            0.30 * discovery
            + 0.25 * engagement
            + 0.25 * preference
            + 0.20 * quality
        )

        age_hours = (now - review.created_at).total_seconds() / 3600
        decay = (age_hours + 2) ** 1.5
        final_score = raw_score / decay

        scored.append((review, final_score))

    scored.sort(key=lambda x: x[1], reverse=True)

    # Stage 3: Diversity enforcement (MMR)
    ranked_reviews = [r for r, _ in scored[:limit * 3]]
    return mmr_rerank(ranked_reviews, limit=limit)


# ---------------------------------------------------------------------------
# 6.3 Cold-Start Tier Detection & Feed Strategy
# ---------------------------------------------------------------------------

def _get_tastemaker_emails():
    """Get tastemaker emails from settings with fallback."""
    from django.conf import settings
    return getattr(settings, 'TASTEMAKER_EMAILS', [
        "tastemaker1@delectable.app",
        "tastemaker2@delectable.app",
        "tastemaker3@delectable.app",
    ])


def get_user_tier(user):
    """Determine user's feed tier (0-3).

    0: Anonymous (handled at view level)
    1: Cold Start — 0 follows, no taste profile
    2: Augmented — < 5 follows OR < 3 reviews
    3: Healthy — >= 5 follows AND >= 3 reviews
    """
    follow_count = Follow.objects.filter(follower=user).count()
    review_count = Review.objects.filter(user=user).count()

    if follow_count == 0:
        return 1  # Cold Start
    if follow_count < 5 or review_count < 3:
        return 2  # Augmented
    return 3  # Healthy


def auto_follow_tastemakers(user):
    """Auto-follow curated tastemaker accounts for new users."""
    tastemakers = User.objects.filter(email__in=_get_tastemaker_emails())
    for tm in tastemakers:
        if tm.id != user.id:
            _, created = Follow.objects.get_or_create(follower=user, following=tm)
            if created:
                from django.db import models as db_models
                User.objects.filter(id=user.id).update(
                    following_count=db_models.F("following_count") + 1
                )
                User.objects.filter(id=tm.id).update(
                    followers_count=db_models.F("followers_count") + 1
                )


def anonymous_feed(limit=20):
    """Feed for anonymous users (tier 0) — trending/popular reviews, no personalization."""
    now = timezone.now()

    # Combine trending venues with popular recent reviews
    trending_venue_ids = VenueTrendingScore.objects.filter(
        score__gt=0
    ).values_list("venue_id", flat=True)[:10]

    trending_reviews = list(
        Review.objects.filter(venue_id__in=trending_venue_ids)
        .select_related("user", "venue")
        .order_by("-like_count", "-created_at")[:int(limit * 0.6)]
    )

    exclude_ids = {r.id for r in trending_reviews}
    popular_reviews = list(
        Review.objects.filter(
            created_at__gte=now - timedelta(days=14),
            rating__gte=7.0,
        )
        .exclude(id__in=exclude_ids)
        .select_related("user", "venue")
        .order_by("-like_count", "-created_at")[:limit - len(trending_reviews)]
    )

    # Interleave
    result = []
    ti, pi = 0, 0
    for i in range(limit):
        if ti < len(trending_reviews) and (i % 3 < 2 or pi >= len(popular_reviews)):
            result.append(trending_reviews[ti])
            ti += 1
        elif pi < len(popular_reviews):
            result.append(popular_reviews[pi])
            pi += 1
        elif ti < len(trending_reviews):
            result.append(trending_reviews[ti])
            ti += 1

    return result[:limit]


def cold_start_feed(viewer, limit=20):
    """Feed for cold-start users (tier 1) — cuisine-preference-based."""
    # Try taste profile preferences
    taste_profile = UserTasteProfile.objects.filter(user=viewer).first()
    preferred = taste_profile.preferred_cuisines if taste_profile else []
    fav_cuisines = set(preferred or viewer.favorite_cuisines or [])

    base_qs = Review.objects.select_related("user", "venue").order_by("-created_at")

    if fav_cuisines:
        # Match reviews from venues with preferred cuisines
        cuisine_filter = Q()
        for cuisine in fav_cuisines:
            cuisine_filter |= Q(venue__cuisine_type__icontains=cuisine)
        reviews = list(base_qs.filter(cuisine_filter)[:limit])
        if len(reviews) < limit:
            # Pad with popular reviews
            exclude_ids = {r.id for r in reviews}
            popular = base_qs.exclude(id__in=exclude_ids).order_by("-like_count")[:limit - len(reviews)]
            reviews.extend(popular)
        return reviews[:limit]

    # No preferences — global popular reviews
    return list(base_qs.order_by("-like_count", "-created_at")[:limit])


def augmented_feed(viewer, limit=20):
    """Feed for augmented users (tier 2) — 60% curated + 40% social."""
    curated_count = int(limit * 0.6)
    social_count = limit - curated_count

    # Social portion: from followed users
    following_ids = set(
        Follow.objects.filter(follower=viewer).values_list("following_id", flat=True)
    )
    social_reviews = list(
        Review.objects.filter(user_id__in=following_ids)
        .select_related("user", "venue")
        .order_by("-created_at")[:social_count]
    )

    # Curated portion: popular reviews matching preferences
    exclude_ids = {r.id for r in social_reviews}
    curated = cold_start_feed(viewer, curated_count)
    curated = [r for r in curated if r.id not in exclude_ids][:curated_count]

    # Merge and interleave
    result = []
    ci, si = 0, 0
    for i in range(limit):
        if i % 3 < 2 and ci < len(curated):
            result.append(curated[ci])
            ci += 1
        elif si < len(social_reviews):
            result.append(social_reviews[si])
            si += 1
        elif ci < len(curated):
            result.append(curated[ci])
            ci += 1

    return result[:limit]


# ---------------------------------------------------------------------------
# 6.4 MMR Diversity Enforcement
# ---------------------------------------------------------------------------

def _review_similarity(r1, r2):
    """Compute similarity between two reviews (0-1)."""
    sim = 0.0
    # Same venue (0.5 weight)
    if r1.venue_id == r2.venue_id:
        sim += 0.5
    # Same cuisine type (0.3 weight)
    cuisine1 = getattr(r1.venue, 'cuisine_type', None) if r1.venue else None
    cuisine2 = getattr(r2.venue, 'cuisine_type', None) if r2.venue else None
    if cuisine1 and cuisine2 and cuisine1 == cuisine2:
        sim += 0.3
    # Same user (0.2 weight)
    if r1.user_id == r2.user_id:
        sim += 0.2
    return sim


def mmr_rerank(reviews, limit=20, lambda_param=0.7):
    """Maximal Marginal Relevance re-ranking for diversity.

    Balances relevance (original order score) with diversity.
    Also enforces hard rules: max 2 same-venue, 4 same-cuisine, 3 same-user in top 20.
    """
    if len(reviews) <= 1:
        return reviews[:limit]

    # Track for hard rules
    venue_counts = defaultdict(int)
    cuisine_counts = defaultdict(int)
    user_counts = defaultdict(int)

    selected = []
    remaining = list(reviews)

    # First item is always the top-scored
    if remaining:
        first = remaining.pop(0)
        selected.append(first)
        venue_counts[first.venue_id] += 1
        cuisine_key = first.venue.cuisine_type or "_none_"
        cuisine_counts[cuisine_key] += 1
        user_counts[first.user_id] += 1

    while remaining and len(selected) < limit:
        best_score = -float("inf")
        best_idx = 0

        for i, candidate in enumerate(remaining):
            # Hard rule checks
            if venue_counts[candidate.venue_id] >= 2:
                continue
            candidate_cuisine_key = candidate.venue.cuisine_type or "_none_"
            if cuisine_counts.get(candidate_cuisine_key, 0) >= 4:
                continue
            if user_counts[candidate.user_id] >= 3:
                continue

            # Relevance score (position-based, higher is better)
            relevance = 1.0 - (i / max(len(remaining), 1))

            # Max similarity to already selected
            max_sim = max(
                (_review_similarity(candidate, s) for s in selected),
                default=0,
            )

            # MMR score
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim

            if mmr_score > best_score:
                best_score = mmr_score
                best_idx = i

        # If no candidate passes hard rules, relax and take the next best
        if best_score == -float("inf"):
            if remaining:
                chosen = remaining.pop(0)
            else:
                break
        else:
            chosen = remaining.pop(best_idx)

        selected.append(chosen)
        venue_counts[chosen.venue_id] += 1
        chosen_cuisine_key = chosen.venue.cuisine_type or "_none_"
        cuisine_counts[chosen_cuisine_key] += 1
        user_counts[chosen.user_id] += 1

    return selected

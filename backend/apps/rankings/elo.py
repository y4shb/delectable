"""
Elo rating algorithm for pairwise venue comparisons.

Uses a logistic model to compute expected scores and adaptive K-factors
based on the number of comparisons a venue has participated in.
"""

import math
import random

from .models import PersonalRanking


def compute_expected(rating_a: float, rating_b: float) -> float:
    """
    Compute the expected score for player A using the logistic Elo formula.

    Returns a value between 0 and 1 representing the probability that A wins.
    """
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))


def _get_k_factor(comparison_count: int) -> float:
    """
    Adaptive K-factor: higher for newer venues with fewer comparisons,
    allowing ratings to converge faster, and lower for well-established ratings.
    """
    if comparison_count < 10:
        return 40.0
    elif comparison_count < 30:
        return 24.0
    else:
        return 16.0


def update_ratings(
    rating_a: float,
    rating_b: float,
    winner: str,
    count_a: int = 0,
    count_b: int = 0,
) -> tuple[float, float]:
    """
    Update Elo ratings after a comparison.

    Args:
        rating_a: Current Elo rating of venue A.
        rating_b: Current Elo rating of venue B.
        winner: 'a' if venue A won, 'b' if venue B won, 'draw' for a tie.
        count_a: Comparison count for venue A (used for K-factor).
        count_b: Comparison count for venue B (used for K-factor).

    Returns:
        Tuple of (new_rating_a, new_rating_b).
    """
    expected_a = compute_expected(rating_a, rating_b)
    expected_b = 1.0 - expected_a

    if winner == "a":
        actual_a, actual_b = 1.0, 0.0
    elif winner == "b":
        actual_a, actual_b = 0.0, 1.0
    else:  # draw
        actual_a, actual_b = 0.5, 0.5

    k_a = _get_k_factor(count_a)
    k_b = _get_k_factor(count_b)

    new_rating_a = rating_a + k_a * (actual_a - expected_a)
    new_rating_b = rating_b + k_b * (actual_b - expected_b)

    return new_rating_a, new_rating_b


def compute_confidence(comparison_count: int) -> float:
    """
    Compute a confidence score 0-1 based on the number of comparisons.

    Uses a logarithmic curve that approaches 1.0 as comparisons increase.
    Reaches ~0.5 at 5 comparisons, ~0.8 at 15, ~0.95 at 50.
    """
    if comparison_count <= 0:
        return 0.0
    return min(1.0, math.log(1 + comparison_count) / math.log(1 + 50))


def get_comparison_pair(user, new_venue=None):
    """
    Select an interesting pair of venues for the user to compare.

    Strategy:
    - If new_venue is specified, pair it with the venue closest in Elo rating.
    - Otherwise, find two venues close in rating to create a close match.
    - Only considers venues the user has reviewed.

    Args:
        user: The User instance.
        new_venue: Optional Venue instance to include in the comparison.

    Returns:
        Tuple of (venue_a, venue_b) or None if not enough venues to compare.
    """
    from apps.reviews.models import Review

    # Get all venues the user has reviewed
    reviewed_venue_ids = list(
        Review.objects.filter(user=user)
        .values_list("venue_id", flat=True)
        .distinct()
    )

    if len(reviewed_venue_ids) < 2:
        return None

    # Ensure rankings exist for all reviewed venues
    existing_venue_ids = set(
        PersonalRanking.objects.filter(user=user, venue_id__in=reviewed_venue_ids)
        .values_list("venue_id", flat=True)
    )
    new_rankings = []
    for vid in reviewed_venue_ids:
        if vid not in existing_venue_ids:
            new_rankings.append(
                PersonalRanking(user=user, venue_id=vid)
            )
    if new_rankings:
        PersonalRanking.objects.bulk_create(new_rankings, ignore_conflicts=True)

    # Get all rankings for reviewed venues, ordered by Elo
    rankings = list(
        PersonalRanking.objects.filter(user=user, venue_id__in=reviewed_venue_ids)
        .select_related("venue")
        .order_by("elo_score")
    )

    if len(rankings) < 2:
        return None

    if new_venue and new_venue.id in reviewed_venue_ids:
        # Find the venue closest in Elo to the new venue
        new_ranking = next(
            (r for r in rankings if r.venue_id == new_venue.id), None
        )
        if new_ranking is None:
            return None

        # Find the closest-rated opponent
        candidates = [r for r in rankings if r.venue_id != new_venue.id]
        if not candidates:
            return None

        closest = min(
            candidates,
            key=lambda r: abs(r.elo_score - new_ranking.elo_score),
        )
        return (new_ranking.venue, closest.venue)

    # Select a pair that is close in rating for an interesting comparison
    # Prefer venues with fewer comparisons to gather more data
    # Use a weighted random selection: weight pairs by closeness + novelty
    pairs = []
    for i in range(len(rankings)):
        for j in range(i + 1, min(i + 4, len(rankings))):
            r_i = rankings[i]
            r_j = rankings[j]
            rating_diff = abs(r_i.elo_score - r_j.elo_score)
            # Novelty bonus: venues with fewer comparisons are more interesting
            novelty = (
                1.0 / (1 + r_i.comparison_count)
                + 1.0 / (1 + r_j.comparison_count)
            )
            # Closeness bonus: closer ratings are more interesting
            closeness = 1.0 / (1 + rating_diff / 100.0)
            weight = closeness * (1 + novelty)
            pairs.append((r_i.venue, r_j.venue, weight))

    if not pairs:
        return None

    # Weighted random selection
    total_weight = sum(w for _, _, w in pairs)
    r = random.random() * total_weight
    cumulative = 0.0
    for venue_a, venue_b, weight in pairs:
        cumulative += weight
        if cumulative >= r:
            return (venue_a, venue_b)

    # Fallback
    chosen = pairs[-1]
    return (chosen[0], chosen[1])


def recalculate_ranks(user):
    """
    Recalculate rank positions for all of a user's personal rankings.

    Ranks are assigned 1-based, ordered by descending Elo score.
    """
    rankings = list(
        PersonalRanking.objects.filter(user=user)
        .order_by("-elo_score")
    )
    for i, ranking in enumerate(rankings, start=1):
        if ranking.rank != i:
            ranking.rank = i
            ranking.save(update_fields=["rank"])

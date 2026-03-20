"""
PostgreSQL-powered search backends for Delectable.

Provides full-text search (tsvector/tsquery), trigram fuzzy matching (pg_trgm),
and PostGIS spatial queries.  All functions gracefully degrade: callers should
check ``django.db.connection.vendor`` before invoking the PostGIS helpers.
"""

from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity,
)
from django.db.models import QuerySet

from apps.venues.models import Dish, Venue


# ---------------------------------------------------------------------------
# Full-text search
# ---------------------------------------------------------------------------


def full_text_search_venues(query: str, limit: int = 20) -> QuerySet:
    """Full-text search with ranking across venue name and cuisine_type.

    Uses ``websearch`` search type so users can write natural queries
    such as ``italian pizza -chain``.
    """
    search_vector = SearchVector("name", weight="A") + SearchVector(
        "cuisine_type", weight="B"
    )
    search_query = SearchQuery(query, search_type="websearch")
    return (
        Venue.objects.annotate(
            rank=SearchRank(search_vector, search_query),
        )
        .filter(rank__gte=0.1)
        .order_by("-rank")[:limit]
    )


# ---------------------------------------------------------------------------
# Trigram (fuzzy) search
# ---------------------------------------------------------------------------


def fuzzy_search_venues(query: str, threshold: float = 0.3) -> QuerySet:
    """Trigram similarity search on Venue.name for typo-tolerant matching."""
    return (
        Venue.objects.annotate(
            similarity=TrigramSimilarity("name", query),
        )
        .filter(similarity__gte=threshold)
        .order_by("-similarity")
    )


def fuzzy_search_dishes(query: str, threshold: float = 0.3) -> QuerySet:
    """Trigram similarity search on Dish.name for typo-tolerant matching."""
    return (
        Dish.objects.annotate(
            similarity=TrigramSimilarity("name", query),
        )
        .filter(similarity__gte=threshold)
        .order_by("-similarity")
    )


# ---------------------------------------------------------------------------
# PostGIS spatial queries
# ---------------------------------------------------------------------------


def spatial_search_venues(
    lat: float, lng: float, radius_meters: float
) -> QuerySet:
    """Return venues within *radius_meters* of (*lat*, *lng*) using ST_DWithin.

    Requires the ``location`` PointField on Venue to be populated and
    PostGIS to be the database backend.
    """
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D

    point = Point(float(lng), float(lat), srid=4326)
    return Venue.objects.filter(
        location__distance_lte=(point, D(m=radius_meters)),
    )


def bbox_search_venues(
    sw_lat: float, sw_lng: float, ne_lat: float, ne_lng: float
) -> QuerySet:
    """Return venues inside a bounding box defined by SW/NE corners."""
    from django.contrib.gis.geos import Polygon

    bbox = Polygon.from_bbox(
        (float(sw_lng), float(sw_lat), float(ne_lng), float(ne_lat))
    )
    bbox.srid = 4326
    return Venue.objects.filter(location__within=bbox)

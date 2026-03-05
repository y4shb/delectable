"""Database-agnostic helpers for JSONField queries."""

from django.db import connection
from django.db.models import Q


def json_array_contains(field_name, values):
    """
    Build a Q filter for JSONField array containment.
    PostgreSQL supports __contains natively; SQLite falls back to __icontains
    on the text representation of the JSON array.
    """
    if connection.vendor == "postgresql":
        return Q(**{f"{field_name}__contains": values})
    # SQLite fallback: match each value within the JSON text
    q = Q()
    for value in values:
        q &= Q(**{f"{field_name}__icontains": value})
    return q

"""Add GIN indexes for full-text search and trigram similarity.

Requires PostgreSQL with pg_trgm extension enabled.
Skipped entirely on SQLite.
"""

from django.db import connection, migrations


def create_search_indexes(apps, schema_editor):
    """Create pg_trgm extension and GIN indexes on PostgreSQL only."""
    if connection.vendor != "postgresql":
        return

    schema_editor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS idx_venue_name_trgm ON venues USING GIN (name gin_trgm_ops)"
    )
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS idx_venue_cuisine_trgm ON venues USING GIN (cuisine_type gin_trgm_ops)"
    )
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS idx_dish_name_trgm ON dishes USING GIN (name gin_trgm_ops)"
    )


def drop_search_indexes(apps, schema_editor):
    if connection.vendor != "postgresql":
        return

    schema_editor.execute("DROP INDEX IF EXISTS idx_dish_name_trgm")
    schema_editor.execute("DROP INDEX IF EXISTS idx_venue_cuisine_trgm")
    schema_editor.execute("DROP INDEX IF EXISTS idx_venue_name_trgm")


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0007_venue_rating_snapshot"),
    ]

    operations = [
        migrations.RunPython(create_search_indexes, drop_search_indexes),
    ]

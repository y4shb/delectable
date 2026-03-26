"""Add PostGIS PointField to Venue for spatial queries.

Keeps existing latitude/longitude DecimalFields for backward compatibility.
Only runs on PostgreSQL — skipped on SQLite.
"""

from django.db import connection, migrations


def add_location_field(apps, schema_editor):
    """Add the location column via raw SQL on PostgreSQL only."""
    if connection.vendor != "postgresql":
        return
    schema_editor.execute(
        "ALTER TABLE venues ADD COLUMN IF NOT EXISTS location geography(Point,4326)"
    )


def remove_location_field(apps, schema_editor):
    if connection.vendor != "postgresql":
        return
    schema_editor.execute("ALTER TABLE venues DROP COLUMN IF EXISTS location")


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0008_search_indexes"),
    ]

    operations = [
        migrations.RunPython(add_location_field, remove_location_field),
    ]

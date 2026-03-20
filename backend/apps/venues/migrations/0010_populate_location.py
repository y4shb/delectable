"""Populate location PointField from existing latitude/longitude values.

This is a data migration that converts Decimal lat/lng pairs into
PostGIS Point geometries. Safe to run on an empty table.
"""

from django.db import connection, migrations


def populate_location_forward(apps, schema_editor):
    """Set location = Point(longitude, latitude) for all venues with coords."""
    if connection.vendor != "postgresql":
        return
    # Use raw SQL for efficiency - ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    schema_editor.execute(
        """
        UPDATE venues
        SET location = ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND location IS NULL
        """
    )


def populate_location_reverse(apps, schema_editor):
    """Reverse: clear location field."""
    if connection.vendor != "postgresql":
        return
    schema_editor.execute("UPDATE venues SET location = NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0009_venue_location_point"),
    ]

    operations = [
        migrations.RunPython(
            populate_location_forward,
            populate_location_reverse,
        ),
    ]

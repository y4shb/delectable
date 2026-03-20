"""Add PostGIS PointField to Venue for spatial queries.

Keeps existing latitude/longitude DecimalFields for backward compatibility.
"""

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0008_search_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="venue",
            name="location",
            field=django.contrib.gis.db.models.fields.PointField(
                geography=True,
                srid=4326,
                null=True,
                blank=True,
                help_text="PostGIS point (populated from latitude/longitude).",
            ),
        ),
    ]

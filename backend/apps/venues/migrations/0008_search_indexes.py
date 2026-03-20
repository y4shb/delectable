"""Add GIN indexes for full-text search and trigram similarity.

Requires PostgreSQL with pg_trgm extension enabled.
These indexes are conditional: they only apply when running on PostgreSQL.
"""

from django.contrib.postgres.indexes import GinIndex, OpClass
from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0007_venue_rating_snapshot"),
    ]

    operations = [
        # Ensure pg_trgm extension is installed
        TrigramExtension(),
        # GIN index for full-text search on Venue (name + cuisine_type)
        migrations.AddIndex(
            model_name="venue",
            index=GinIndex(
                OpClass(
                    expression="name",
                    name="gin_trgm_ops",
                ),
                name="idx_venue_name_trgm",
            ),
        ),
        migrations.AddIndex(
            model_name="venue",
            index=GinIndex(
                OpClass(
                    expression="cuisine_type",
                    name="gin_trgm_ops",
                ),
                name="idx_venue_cuisine_trgm",
            ),
        ),
        # GIN index for trigram similarity on Dish.name
        migrations.AddIndex(
            model_name="dish",
            index=GinIndex(
                OpClass(
                    expression="name",
                    name="gin_trgm_ops",
                ),
                name="idx_dish_name_trgm",
            ),
        ),
    ]

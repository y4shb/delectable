import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("venues", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PairwiseComparison",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pairwise_comparisons",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "venue_a",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comparisons_as_a",
                        to="venues.venue",
                    ),
                ),
                (
                    "venue_b",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comparisons_as_b",
                        to="venues.venue",
                    ),
                ),
                (
                    "winner",
                    models.ForeignKey(
                        blank=True,
                        help_text="Null means 'too tough to call' (draw).",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comparison_wins",
                        to="venues.venue",
                    ),
                ),
            ],
            options={
                "db_table": "pairwise_comparisons",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="pairwisecomparison",
            constraint=models.UniqueConstraint(
                fields=("user", "venue_a", "venue_b"),
                name="uq_comparison_user_venue_pair",
            ),
        ),
        migrations.AddIndex(
            model_name="pairwisecomparison",
            index=models.Index(
                fields=["user", "-created_at"],
                name="idx_comparison_user_created",
            ),
        ),
        migrations.CreateModel(
            name="PersonalRanking",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, db_index=True),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "elo_score",
                    models.FloatField(
                        default=1500.0,
                        help_text="Elo rating for this venue in the user's personal ranking.",
                    ),
                ),
                (
                    "comparison_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Number of comparisons this venue has participated in.",
                    ),
                ),
                (
                    "confidence",
                    models.FloatField(
                        default=0.0,
                        help_text="Confidence level 0-1 based on number of comparisons.",
                    ),
                ),
                (
                    "rank",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Position in the user's personal ranking (1-based).",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="personal_rankings",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "venue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="personal_rankings",
                        to="venues.venue",
                    ),
                ),
            ],
            options={
                "db_table": "personal_rankings",
                "ordering": ["-elo_score"],
            },
        ),
        migrations.AddConstraint(
            model_name="personalranking",
            constraint=models.UniqueConstraint(
                fields=("user", "venue"),
                name="uq_personal_ranking_user_venue",
            ),
        ),
        migrations.AddIndex(
            model_name="personalranking",
            index=models.Index(
                fields=["user", "-elo_score"],
                name="idx_ranking_user_elo",
            ),
        ),
        migrations.AddIndex(
            model_name="personalranking",
            index=models.Index(
                fields=["user", "rank"],
                name="idx_ranking_user_rank",
            ),
        ),
    ]

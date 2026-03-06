import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("venues", "0004_seasonalhighlight"),
        ("reviews", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="venue",
            name="price_level",
            field=models.PositiveSmallIntegerField(
                blank=True,
                choices=[(1, "$"), (2, "$$"), (3, "$$$"), (4, "$$$$")],
                null=True,
            ),
        ),
        migrations.CreateModel(
            name="VenueOwner",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("is_verified", models.BooleanField(default=False)),
                ("role", models.CharField(choices=[("owner", "Owner"), ("manager", "Manager")], default="owner", max_length=50)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="owned_venues", to=settings.AUTH_USER_MODEL)),
                ("venue", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="owners", to="venues.venue")),
            ],
            options={
                "db_table": "venue_owners",
            },
        ),
        migrations.AddConstraint(
            model_name="venueowner",
            constraint=models.UniqueConstraint(fields=["user", "venue"], name="uq_venue_owner_user_venue"),
        ),
        migrations.CreateModel(
            name="VenueResponse",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("text", models.TextField(max_length=1000)),
                ("review", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="venue_response", to="reviews.review")),
                ("responder", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "venue_responses",
            },
        ),
        migrations.CreateModel(
            name="KitchenStory",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=300)),
                ("story_type", models.CharField(choices=[("chef_interview", "Chef Interview"), ("sourcing", "Sourcing Story"), ("recipe", "Recipe Feature"), ("behind_scenes", "Behind the Scenes"), ("history", "History")], max_length=30)),
                ("content", models.TextField()),
                ("cover_photo_url", models.URLField(blank=True, default="", max_length=500)),
                ("chef_name", models.CharField(blank=True, default="", max_length=200)),
                ("chef_title", models.CharField(blank=True, default="", max_length=200)),
                ("chef_photo_url", models.URLField(blank=True, default="", max_length=500)),
                ("is_published", models.BooleanField(default=True)),
                ("view_count", models.PositiveIntegerField(default=0)),
                ("like_count", models.PositiveIntegerField(default=0)),
                ("venue", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="kitchen_stories", to="venues.venue")),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="kitchen_stories", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "kitchen_stories",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="FoodGuide",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=300)),
                ("description", models.TextField(blank=True, default="")),
                ("city", models.CharField(max_length=100)),
                ("neighborhood", models.CharField(blank=True, default="", max_length=200)),
                ("cover_photo_url", models.URLField(blank=True, default="", max_length=500)),
                ("duration_hours", models.PositiveSmallIntegerField(default=4)),
                ("is_published", models.BooleanField(default=False)),
                ("view_count", models.PositiveIntegerField(default=0)),
                ("save_count", models.PositiveIntegerField(default=0)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="food_guides", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "food_guides",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="GuideStop",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("sort_order", models.PositiveSmallIntegerField(default=0)),
                ("description", models.TextField(blank=True, default="", max_length=500)),
                ("recommended_dishes", models.JSONField(blank=True, default=list)),
                ("estimated_time_minutes", models.PositiveSmallIntegerField(default=45)),
                ("guide", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stops", to="venues.foodguide")),
                ("venue", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="venues.venue")),
            ],
            options={
                "db_table": "guide_stops",
                "ordering": ["sort_order"],
            },
        ),
        migrations.AddConstraint(
            model_name="guidestop",
            constraint=models.UniqueConstraint(fields=["guide", "venue"], name="uq_guide_stop_guide_venue"),
        ),
    ]

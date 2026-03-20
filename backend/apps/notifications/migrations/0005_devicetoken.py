# Generated migration for DeviceToken model

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0004_notification_idx_notif_recipient_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DeviceToken",
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
                ("token", models.TextField(unique=True)),
                (
                    "platform",
                    models.CharField(
                        choices=[
                            ("web", "Web"),
                            ("ios", "iOS"),
                            ("android", "Android"),
                        ],
                        max_length=10,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="device_tokens",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "device_tokens",
                "indexes": [
                    models.Index(
                        fields=["user", "is_active"],
                        name="idx_device_token_user_active",
                    ),
                ],
            },
        ),
    ]

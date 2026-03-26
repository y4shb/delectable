"""Increase Comment text max_length from 1000 to 2000."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reviews", "0011_contentreport"),
    ]

    operations = [
        migrations.AlterField(
            model_name="comment",
            name="text",
            field=models.TextField(max_length=2000),
        ),
    ]

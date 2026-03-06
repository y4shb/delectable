# Generated migration for SeasonalHighlight model

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0003_backfill_dishes_from_reviews'),
    ]

    operations = [
        migrations.CreateModel(
            name='SeasonalHighlight',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('dish_name', models.CharField(max_length=200)),
                ('season', models.CharField(choices=[('spring', 'Spring'), ('summer', 'Summer'), ('fall', 'Fall'), ('winter', 'Winter')], max_length=10)),
                ('description', models.TextField(blank=True, default='')),
                ('photo_url', models.URLField(blank=True, default='', max_length=500)),
                ('is_active', models.BooleanField(default=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('venue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='seasonal_highlights', to='venues.venue')),
            ],
            options={
                'db_table': 'seasonal_highlights',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='seasonalhighlight',
            index=models.Index(fields=['season', 'is_active'], name='idx_seasonal_season_active'),
        ),
    ]

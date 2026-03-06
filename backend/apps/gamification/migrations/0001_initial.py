# Generated migration for MonthlyRecap model

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MonthlyRecap',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('year', models.PositiveIntegerField()),
                ('month', models.PositiveIntegerField()),
                ('total_reviews', models.PositiveIntegerField(default=0)),
                ('total_venues', models.PositiveIntegerField(default=0)),
                ('total_photos', models.PositiveIntegerField(default=0)),
                ('new_cuisines_tried', models.PositiveIntegerField(default=0)),
                ('top_cuisine', models.CharField(blank=True, default='', max_length=100)),
                ('top_venue_name', models.CharField(blank=True, default='', max_length=200)),
                ('top_rated_dish', models.CharField(blank=True, default='', max_length=200)),
                ('longest_streak_in_month', models.PositiveIntegerField(default=0)),
                ('xp_earned', models.PositiveIntegerField(default=0)),
                ('likes_received', models.PositiveIntegerField(default=0)),
                ('stats_data', models.JSONField(blank=True, default=dict)),
                ('generated_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='monthly_recaps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'monthly_recaps',
            },
        ),
        migrations.AddConstraint(
            model_name='monthlyrecap',
            constraint=models.UniqueConstraint(fields=('user', 'year', 'month'), name='uq_monthly_recap'),
        ),
        migrations.AddIndex(
            model_name='monthlyrecap',
            index=models.Index(fields=['user', '-year', '-month'], name='idx_monthly_recap_user'),
        ),
    ]

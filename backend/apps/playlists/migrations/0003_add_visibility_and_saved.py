# Generated migration for playlist visibility and SavedPlaylist model

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils.text import slugify

import apps.playlists.models


def populate_slugs(apps, schema_editor):
    """Generate unique slugs for existing playlists."""
    Playlist = apps.get_model('playlists', 'Playlist')
    for playlist in Playlist.objects.all():
        base_slug = slugify(playlist.title)[:200] or 'playlist'
        playlist.slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        playlist.save(update_fields=['slug'])


def populate_share_codes(apps, schema_editor):
    """Generate unique share codes for existing playlists."""
    import secrets
    Playlist = apps.get_model('playlists', 'Playlist')
    for playlist in Playlist.objects.filter(share_code=''):
        playlist.share_code = secrets.token_urlsafe(4)[:6].lower()
        playlist.save(update_fields=['share_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('playlists', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Add slug field WITHOUT unique constraint
        migrations.AddField(
            model_name='playlist',
            name='slug',
            field=models.SlugField(blank=True, max_length=220, default=''),
            preserve_default=False,
        ),
        # Step 2: Populate unique slugs for existing rows
        migrations.RunPython(populate_slugs, migrations.RunPython.noop),
        # Step 3: Now add the unique constraint
        migrations.AlterField(
            model_name='playlist',
            name='slug',
            field=models.SlugField(blank=True, max_length=220, unique=True),
        ),
        # Add visibility field
        migrations.AddField(
            model_name='playlist',
            name='visibility',
            field=models.CharField(
                choices=[('public', 'Public'), ('private', 'Private'), ('followers', 'Followers Only')],
                default='public',
                max_length=20,
            ),
        ),
        # Step 4: Add share_code WITHOUT unique first
        migrations.AddField(
            model_name='playlist',
            name='share_code',
            field=models.CharField(
                default=apps.playlists.models.generate_share_code,
                max_length=10,
            ),
        ),
        # Step 5: Populate share codes for existing rows
        migrations.RunPython(populate_share_codes, migrations.RunPython.noop),
        # Step 6: Now add unique constraint
        migrations.AlterField(
            model_name='playlist',
            name='share_code',
            field=models.CharField(
                default=apps.playlists.models.generate_share_code,
                max_length=10,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='playlist',
            name='fork_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='playlist',
            name='save_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='playlist',
            name='forked_from',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='forks',
                to='playlists.playlist',
            ),
        ),
        # Remove old is_public field (replaced by visibility)
        migrations.RemoveField(
            model_name='playlist',
            name='is_public',
        ),
        # Create SavedPlaylist model
        migrations.CreateModel(
            name='SavedPlaylist',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_playlists',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('playlist', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saves',
                    to='playlists.playlist',
                )),
            ],
            options={
                'db_table': 'saved_playlists',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='savedplaylist',
            constraint=models.UniqueConstraint(
                fields=('user', 'playlist'),
                name='uq_saved_playlist_user_playlist',
            ),
        ),
        migrations.AddIndex(
            model_name='savedplaylist',
            index=models.Index(
                fields=['user', '-created_at'],
                name='idx_saved_playlist_user',
            ),
        ),
    ]

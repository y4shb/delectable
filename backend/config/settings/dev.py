"""
Development settings for Delectable backend.
Uses SQLite for simplicity (no PostGIS in dev unless configured).
"""

from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

# CORS — allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Database — use PostgreSQL with PostGIS if available, fallback to SQLite
import os

if os.environ.get("DB_NAME"):
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.environ.get("DB_NAME", "delectable"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    # SQLite on NTFS-mounted WSL paths has locking issues.
    # Use Linux home directory for the database file.
    import pathlib
    _db_path = pathlib.Path.home() / "delectable_dev.sqlite3"
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(_db_path),
        }
    }

# Longer token lifetime in dev for convenience
SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"] = __import__("datetime").timedelta(hours=1)  # noqa: F405

# Refresh token cookie — not secure in dev (HTTP, not HTTPS)
REFRESH_TOKEN_COOKIE_SECURE = False

# Email — console backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

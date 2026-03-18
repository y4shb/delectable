"""
Production settings for Delectable backend.
Requires all env vars to be set.
"""

import os
import sys

from .base import *  # noqa: F401, F403

DEBUG = False

# SECURITY: Enforce secret key in production
if not os.environ.get("DJANGO_SECRET_KEY"):
    sys.exit("CRITICAL: DJANGO_SECRET_KEY environment variable must be set in production!")

# SECURITY: Enforce allowed hosts
if not os.environ.get("ALLOWED_HOSTS"):
    sys.exit("CRITICAL: ALLOWED_HOSTS environment variable must be set in production!")
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# Database — PostgreSQL with PostGIS (required in production)
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": 600,
    }
}

# CORS — restrict to frontend origin
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Refresh token cookie — secure in production
REFRESH_TOKEN_COOKIE_SECURE = True

# Cache — Redis in production (overrides base.py LocMemCache)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
        "TIMEOUT": 300,
        "OPTIONS": {
            "db": 0,
        },
    }
}

# Static files
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

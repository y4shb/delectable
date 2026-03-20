"""
Django base settings for Delectable backend.
Shared across all environments (dev, prod).
"""

import os
from datetime import timedelta
from pathlib import Path

from celery.schedules import crontab

from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY: Secret key must be set via environment variable
# Never use a default in production - the app will fail to start without it
_secret_key = os.environ.get("DJANGO_SECRET_KEY")
if not _secret_key:
    import warnings
    warnings.warn(
        "DJANGO_SECRET_KEY not set! Using insecure default for development only.",
        RuntimeWarning,
    )
    # Only allow insecure default in DEBUG mode (checked at runtime)
    _secret_key = "django-insecure-dev-only-never-use-in-production"
SECRET_KEY = _secret_key

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "django.contrib.gis",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "storages",
    "django_celery_beat",
    # Local apps
    "apps.core",
    "apps.users",
    "apps.venues",
    "apps.reviews",
    "apps.playlists",
    "apps.feed",
    "apps.search",
    "apps.notifications",
    "apps.gamification",
    "apps.sharing",
    "apps.ml",
    "apps.rankings",
    "apps.groups",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

APPEND_SLASH = True

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Custom user model
AUTH_USER_MODEL = "users.User"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"

# Media files (user uploads)
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------------------------------------------------------------
# Django REST Framework
# --------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "5/minute",
        "register": "3/minute",
        "taste_match": "30/minute",
        "uploads": "20/hour",
        "playlist_actions": "60/hour",
        # Gamification rate limits to prevent XP farming
        "likes": "100/hour",
        "comments": "30/hour",
        "reviews": "10/hour",
        "referrals": "5/hour",
        "challenges": "20/hour",
    },
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
}

# --------------------------------------------------------------------------
# SimpleJWT
# --------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ.get("JWT_SECRET_KEY", SECRET_KEY),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Refresh token cookie settings
REFRESH_TOKEN_COOKIE_NAME = "de_refresh"
REFRESH_TOKEN_COOKIE_PATH = "/api/auth/"
REFRESH_TOKEN_COOKIE_HTTPONLY = True
REFRESH_TOKEN_COOKIE_SAMESITE = "Lax"

# --------------------------------------------------------------------------
# CORS
# --------------------------------------------------------------------------
CORS_ALLOW_CREDENTIALS = True

# --------------------------------------------------------------------------
# Cache — abstract layer, swapped to Redis at scale
# --------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "delectable-default",
        "TIMEOUT": 300,
    }
}

# --------------------------------------------------------------------------
# S3 Storage (when configured via environment variables)
# --------------------------------------------------------------------------
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET", "delectable-uploads")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION", "us-east-1")
AWS_S3_CUSTOM_DOMAIN = os.environ.get("AWS_CLOUDFRONT_DOMAIN")  # Optional CloudFront
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
AWS_QUERYSTRING_AUTH = False  # Public read via CloudFront

# Only use S3 storage if credentials are configured
if AWS_ACCESS_KEY_ID:
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

# Maximum upload size: 10MB
UPLOAD_MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed upload content types
UPLOAD_ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
}

# --------------------------------------------------------------------------
# Feed Intelligence - Tastemaker accounts for cold-start onboarding
# --------------------------------------------------------------------------
TASTEMAKER_EMAILS = [
    "tastemaker1@delectable.app",
    "tastemaker2@delectable.app",
    "tastemaker3@delectable.app",
]

# --------------------------------------------------------------------------
# Celery — Distributed task queue
# --------------------------------------------------------------------------
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "security": {
            "format": "[%(asctime)s] %(levelname)s %(message)s",
        },
    },
    "handlers": {
        "security_file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "logs" / "security.log",
            "formatter": "security",
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "security",
        },
    },
    "loggers": {
        "delectable.security": {
            "handlers": ["security_file", "console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

CELERY_BEAT_SCHEDULE = {
    "recompute-trending": {
        "task": "apps.feed.tasks.recompute_trending",
        "schedule": 30 * 60,  # Every 30 minutes
    },
    "process-streak-check": {
        "task": "apps.gamification.tasks.process_streak_check",
        "schedule": crontab(hour=0, minute=0),
    },
    "send-weekly-digest": {
        "task": "apps.notifications.tasks.send_weekly_digest",
        "schedule": crontab(hour=10, minute=0, day_of_week="sunday"),
    },
    "refresh-venue-similarity": {
        "task": "apps.venues.tasks.refresh_venue_similarity",
        "schedule": crontab(hour=3, minute=0),
    },
    "compute-rating-snapshots": {
        "task": "apps.venues.tasks.compute_rating_snapshots",
        "schedule": crontab(hour=4, minute=0),
    },
}

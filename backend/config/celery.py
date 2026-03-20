"""
Celery application factory for Delectable backend.

Configures Celery with Django settings and auto-discovers tasks
from all installed apps.
"""

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("delectable")

# Read config from Django settings; all celery-related keys must
# be prefixed with CELERY_ (e.g. CELERY_BROKER_URL).
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in each installed app.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Diagnostic task that prints its own request info."""
    print(f"Request: {self.request!r}")

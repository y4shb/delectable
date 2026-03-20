"""Signals for the venues app.

Keeps the PostGIS ``location`` PointField in sync whenever ``latitude``
or ``longitude`` are changed on a Venue instance.
"""

import logging

from django.db import connection
from django.db.models.signals import pre_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(pre_save, sender="venues.Venue")
def sync_venue_location(sender, instance, **kwargs):
    """Populate ``location`` from ``latitude``/``longitude`` before save.

    Only runs when the database backend is PostgreSQL (PostGIS).  On
    SQLite the ``location`` field does not exist, so this is a no-op.
    """
    if connection.vendor != "postgresql":
        return

    lat = instance.latitude
    lng = instance.longitude

    if lat is not None and lng is not None:
        try:
            from django.contrib.gis.geos import Point

            instance.location = Point(
                float(lng), float(lat), srid=4326
            )
        except Exception:
            logger.warning(
                "Failed to create Point for venue %s (lat=%s, lng=%s)",
                instance.pk,
                lat,
                lng,
                exc_info=True,
            )
    else:
        instance.location = None

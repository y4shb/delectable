from django.apps import AppConfig


class VenuesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.venues"

    def ready(self):
        import apps.venues.signals  # noqa: F401

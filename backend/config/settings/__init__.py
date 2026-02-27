import os

env = os.environ.get("DJANGO_SETTINGS_MODULE", "")
if not env or env == "config.settings":
    # Default to dev settings if no specific module is set
    from config.settings.dev import *  # noqa: F401, F403

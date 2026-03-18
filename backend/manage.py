#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Add venv site-packages for environments where venv is not activated
_VENV_SITE = "/home/ybhardwa/m1dev/delectable/venv/lib/python3.14/site-packages"
if _VENV_SITE not in sys.path:
    sys.path.insert(0, _VENV_SITE)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

#!/bin/bash
# Delectable Backend — Run Script
# Usage: ./run-backend.sh [--seed] [--no-migrate]
#
# Starts the Django development server on port 8000.
#
# First-time setup:
#   python3 -m venv venv
#   source venv/bin/activate
#   pip install -r backend/requirements.txt
#   ./run-backend.sh --seed

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
SEED=false
MIGRATE=true

# Parse arguments
for arg in "$@"; do
  case $arg in
    --seed) SEED=true ;;
    --no-migrate) MIGRATE=false ;;
    --help|-h)
      echo "Usage: ./run-backend.sh [--seed] [--no-migrate]"
      echo ""
      echo "Options:"
      echo "  --seed         Run seed command after migrations (creates sample data)"
      echo "  --no-migrate   Skip running migrations"
      echo ""
      echo "Environment variables:"
      echo "  DB_NAME        Set to use PostgreSQL+PostGIS (e.g., DB_NAME=delectable)"
      echo "  DB_USER        PostgreSQL user (default: postgres)"
      echo "  DB_PASSWORD    PostgreSQL password (default: postgres)"
      echo "  DB_HOST        PostgreSQL host (default: 127.0.0.1)"
      echo "  DB_PORT        PostgreSQL port (default: 5432)"
      echo ""
      echo "Without DB_NAME set, SQLite is used automatically."
      exit 0
      ;;
  esac
done

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: backend directory not found at $BACKEND_DIR"
  exit 1
fi

# Try to activate venv from common locations
if [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
  source "$BACKEND_DIR/venv/bin/activate"
elif [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
  source "$SCRIPT_DIR/venv/bin/activate"
elif [ -n "$VIRTUAL_ENV" ]; then
  echo "Using active virtual environment: $VIRTUAL_ENV"
else
  echo "Warning: No virtual environment found. Using system Python."
  echo "  Create one with: python3 -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
fi

# Set Django settings
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.dev}"

cd "$BACKEND_DIR"

echo "=== Delectable Backend ==="

if [ -n "$DB_NAME" ]; then
  echo "Database: PostgreSQL ($DB_NAME @ ${DB_HOST:-127.0.0.1}:${DB_PORT:-5432})"
else
  echo "Database: SQLite (~/$USER/delectable_dev.sqlite3)"
fi

# Run migrations
if [ "$MIGRATE" = true ]; then
  echo "Running migrations..."
  python manage.py migrate 2>&1 | grep -E "Applying|No migrations" | tail -5
  echo ""
fi

# Seed data if requested
if [ "$SEED" = true ]; then
  echo "Seeding database..."
  python manage.py seed --clear
  echo ""
fi

echo "Starting Django dev server on http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""
python manage.py runserver 0.0.0.0:8000

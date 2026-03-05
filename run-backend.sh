#!/bin/bash
# Delectable Backend — Run Script
# Usage: ./run-backend.sh
#
# This starts the Django development server on port 8000.
# Make sure you have the virtual environment set up first:
#   python3 -m venv venv
#   source venv/bin/activate
#   pip install -r backend/requirements.txt
#   cd backend && python manage.py migrate

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: backend directory not found at $BACKEND_DIR"
  exit 1
fi

# Try to activate venv from common locations
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
  source "$SCRIPT_DIR/venv/bin/activate"
elif [ -f "$SCRIPT_DIR/../de_backend_venv/bin/activate" ]; then
  source "$SCRIPT_DIR/../de_backend_venv/bin/activate"
elif [ -n "$VIRTUAL_ENV" ]; then
  echo "Using active virtual environment: $VIRTUAL_ENV"
else
  echo "Warning: No virtual environment found. Using system Python."
  echo "  Tip: Create one with: python3 -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
fi

cd "$BACKEND_DIR"

echo "=== Delectable Backend ==="
echo "Running migrations..."
python manage.py migrate --run-syncdb 2>&1 | tail -1

echo "Starting Django dev server on http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""
python manage.py runserver 0.0.0.0:8000

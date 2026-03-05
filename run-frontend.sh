#!/bin/bash
# Delectable Frontend — Run Script
# Usage: ./run-frontend.sh
#
# This starts the Next.js development server on port 3000.
# Make sure you have dependencies installed first:
#   npm install

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/package.json" ]; then
  echo "Error: package.json not found at $SCRIPT_DIR"
  exit 1
fi

cd "$SCRIPT_DIR"

# Install deps if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "=== Delectable Frontend ==="
echo "Starting Next.js dev server on http://localhost:3000"
echo "Press Ctrl+C to stop."
echo ""
npm run dev

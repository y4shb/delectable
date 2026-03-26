#!/bin/bash
# Delectable Frontend — Run Script
# Usage: ./run-frontend.sh [--ios] [--install]
#
# Starts the Next.js development server on port 3000.
#
# First-time setup:
#   npm install

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_BUILD=false
FORCE_INSTALL=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --ios)
      IOS_BUILD=true
      ;;
    --install)
      FORCE_INSTALL=true
      ;;
    --help|-h)
      echo "Usage: ./run-frontend.sh [--ios] [--install]"
      echo ""
      echo "Options:"
      echo "  --ios       Build for iOS (static export + Capacitor sync + open Xcode)"
      echo "  --install   Force reinstall node_modules"
      echo ""
      echo "Without flags, starts the Next.js dev server on http://localhost:3000"
      exit 0
      ;;
  esac
done

if [ ! -f "$SCRIPT_DIR/package.json" ]; then
  echo "Error: package.json not found at $SCRIPT_DIR"
  exit 1
fi

cd "$SCRIPT_DIR"

# Install deps if node_modules is missing or forced
if [ "$FORCE_INSTALL" = true ] || [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

echo "=== Delectable Frontend ==="

if [ "$IOS_BUILD" = true ]; then
  echo "Building for iOS..."
  echo ""
  echo "Step 1/3: Building Next.js static export..."
  CAPACITOR_BUILD=true npm run build
  echo ""
  echo "Step 2/3: Syncing with Capacitor..."
  npx cap sync ios
  echo ""
  echo "Step 3/3: Opening Xcode..."
  npx cap open ios
  echo ""
  echo "Done. Build and run from Xcode (Cmd+R)."
else
  echo "Starting Next.js dev server on http://localhost:3000"
  echo "Press Ctrl+C to stop."
  echo ""
  npm run dev
fi

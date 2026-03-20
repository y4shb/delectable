#!/bin/bash
# Delectable iOS — Build Script
# Usage: ./scripts/ios-build.sh [--release] [--testflight]
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

RELEASE=false
TESTFLIGHT=false

for arg in "$@"; do
  case $arg in
    --release) RELEASE=true ;;
    --testflight) TESTFLIGHT=true ;;
    --help|-h)
      echo "Usage: ./scripts/ios-build.sh [--release] [--testflight]"
      echo ""
      echo "Options:"
      echo "  --release     Build release configuration (optimized)"
      echo "  --testflight  Build, archive, and upload to TestFlight via Fastlane"
      echo ""
      echo "Without flags, builds a debug version and opens the simulator."
      exit 0
      ;;
  esac
done

echo "=== Delectable iOS Build ==="

# Step 1: Build Next.js
echo "Step 1/4: Building Next.js static export..."
CAPACITOR_BUILD=true npx next build

# Step 2: Sync to iOS
echo "Step 2/4: Syncing Capacitor..."
npx cap sync ios

if [ "$TESTFLIGHT" = true ]; then
  # Step 3: Build & upload via Fastlane
  echo "Step 3/4: Building with Fastlane..."
  cd ios
  bundle exec fastlane beta
  echo ""
  echo "=== Uploaded to TestFlight ==="
elif [ "$RELEASE" = true ]; then
  # Step 3: Archive via xcodebuild
  echo "Step 3/4: Archiving release build..."
  cd ios/App
  xcodebuild archive \
    -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -archivePath "$PROJECT_DIR/build/Delectable.xcarchive" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Automatic
  echo ""
  echo "Step 4/4: Archive created at build/Delectable.xcarchive"
  echo "Open Xcode Organizer to distribute: Window > Organizer"
else
  # Debug: open in simulator
  echo "Step 3/4: Opening in Xcode..."
  npx cap open ios
  echo ""
  echo "Build and run in Xcode with Cmd+R"
fi

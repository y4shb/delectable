#!/bin/bash
# Delectable iOS — First-Time Setup
# Run this once to initialize the Capacitor iOS project.
# Requires: Xcode installed, Node.js, CocoaPods (gem install cocoapods)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Delectable iOS Setup ==="

# 1. Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required"; exit 1; }
command -v pod >/dev/null 2>&1 || { echo "Error: CocoaPods is required. Install: gem install cocoapods"; exit 1; }
command -v xcodebuild >/dev/null 2>&1 || { echo "Error: Xcode is required"; exit 1; }

# 2. Install npm deps
echo "Installing npm dependencies..."
npm install

# 3. Build the static export
echo "Building Next.js static export..."
CAPACITOR_BUILD=true npx next build

# 4. Add iOS platform if not present
if [ ! -d "ios" ]; then
  echo "Adding iOS platform..."
  npx cap add ios
else
  echo "iOS platform already exists, syncing..."
fi

# 5. Sync web assets to iOS
echo "Syncing web assets to iOS..."
npx cap sync ios

# 6. Install CocoaPods
echo "Installing CocoaPods dependencies..."
cd ios/App
pod install
cd "$PROJECT_DIR"

# 7. Create App Icons directory placeholder
mkdir -p ios/App/App/Assets.xcassets/AppIcon.appiconset

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add your 1024x1024 app icon to ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "  2. Open Xcode: npx cap open ios"
echo "  3. Set your signing team in Xcode (Signing & Capabilities)"
echo "  4. Add capabilities: Push Notifications, Associated Domains"
echo "  5. Build and run: Cmd+R"

#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Kateb — One-shot APK build script (EAS Cloud)
#
# Usage:
#   cd /app/mobile
#   ./scripts/build-apk.sh
#
# This script:
#   1. Installs deps (idempotent)
#   2. Ensures EAS CLI is installed
#   3. Logs you into Expo (interactive)
#   4. Initializes the EAS project if needed
#   5. Triggers a preview APK build on EAS Cloud
# ---------------------------------------------------------------------------
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "📦  Installing dependencies…"
npm install --no-fund --no-audit

if ! command -v eas >/dev/null 2>&1; then
  echo "🔧  Installing EAS CLI globally…"
  npm install -g eas-cli
fi

echo "🔐  Verifying Expo login (you'll be prompted if not logged in)…"
eas whoami >/dev/null 2>&1 || eas login

echo "🆔  Linking project to EAS (skip if already linked)…"
eas init --non-interactive --force || true

echo "🚀  Starting Android APK build (preview profile)…"
echo "   This will take 15-25 minutes. You can close the terminal once it's queued."
eas build --platform android --profile preview --non-interactive

echo "✅  Build started. Download link will appear above when finished."
echo "    Or visit: https://expo.dev/accounts/$(eas whoami)/projects/kateb-mobile/builds"

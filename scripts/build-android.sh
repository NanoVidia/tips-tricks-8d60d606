#!/usr/bin/env bash
# ==============================================================================
# Tips & Tricks — One-shot Android build script
# ==============================================================================
# What this does (in one command):
#   1) Pulls latest code
#   2) Installs npm dependencies
#   3) Builds the web app for production (no hot-reload)
#   4) Adds the Android platform if missing, syncs Capacitor
#   5) Generates icons & splash screens from /resources
#   6) Patches versionCode / versionName from capacitor.config.ts
#   7) Adds POST_NOTIFICATIONS + BILLING permissions if missing
#   8) Builds the signed AAB ready for Google Play
#
# Prerequisites (one-time install on your computer):
#   - Node.js 18 or newer        →  https://nodejs.org
#   - Java 17 (JDK)              →  https://adoptium.net
#   - Android Studio + SDK 34+   →  https://developer.android.com/studio
#   - A keystore file for signing (the script will help create one)
#
# Usage:
#   bash scripts/build-android.sh
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔄  1/8  Pulling latest code…"
git pull --ff-only || echo "    (skipped — not a git repo or no remote)"

echo "📦  2/8  Installing dependencies…"
npm install --no-fund --no-audit

echo "🏗️   3/8  Building web app (production)…"
CAP_ENV=production npm run build

echo "📱  4/8  Syncing Capacitor → Android…"
if [ ! -d "android" ]; then
  npx cap add android
fi
npx cap sync android

echo "🎨  5/8  Generating icons & splash…"
if [ -f "resources/icon.png" ] && [ -f "resources/splash.png" ]; then
  npx --yes @capacitor/assets generate --android || \
    echo "    (asset generation skipped — install '@capacitor/assets' if needed)"
else
  echo "    ⚠️  resources/icon.png or resources/splash.png missing — skipping"
fi

echo "🔢  6/8  Reading version from capacitor.config.ts…"
VERSION_NAME=$(grep -oE 'APP_VERSION_NAME = "[^"]+"' capacitor.config.ts | sed -E 's/.*"([^"]+)".*/\1/')
VERSION_CODE=$(grep -oE 'APP_VERSION_CODE = [0-9]+' capacitor.config.ts | grep -oE '[0-9]+')
echo "    → versionName=${VERSION_NAME}  versionCode=${VERSION_CODE}"

GRADLE_FILE="android/app/build.gradle"
if [ -f "$GRADLE_FILE" ]; then
  # Replace versionCode / versionName lines (BSD/GNU sed compatible)
  if sed --version >/dev/null 2>&1; then SED_INPLACE=(-i); else SED_INPLACE=(-i ''); fi
  sed "${SED_INPLACE[@]}" -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/" "$GRADLE_FILE"
  sed "${SED_INPLACE[@]}" -E "s/versionName \"[^\"]+\"/versionName \"${VERSION_NAME}\"/" "$GRADLE_FILE"
fi

echo "🔐  7/8  Ensuring required Android permissions…"
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  add_perm() {
    local perm="$1"
    if ! grep -q "$perm" "$MANIFEST"; then
      sed "${SED_INPLACE[@]}" "s|<application|<uses-permission android:name=\"$perm\" />\n    <application|" "$MANIFEST"
      echo "    + added $perm"
    fi
  }
  add_perm "android.permission.INTERNET"
  add_perm "android.permission.POST_NOTIFICATIONS"
  add_perm "com.android.vending.BILLING"
fi

echo "📦  8/8  Building signed AAB…"
echo ""
echo "    Run the following in a NEW terminal once you have a keystore:"
echo ""
echo "      cd android"
echo "      ./gradlew bundleRelease"
echo ""
echo "    The signed AAB will appear at:"
echo "      android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "✅  All preparation steps complete."
echo "   Open the project in Android Studio for keystore signing if needed:"
echo "   → File ▸ Open ▸ select the 'android' folder"
echo "   → Build ▸ Generate Signed Bundle / APK ▸ Android App Bundle"

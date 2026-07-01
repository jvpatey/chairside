#!/usr/bin/env bash
# Prints release setup commands and verifies repo artifacts for App Store readiness.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
ERRORS=0

warn() { echo "⚠️  $*"; }
ok() { echo "✅ $*"; }
fail() { echo "❌ $*"; ERRORS=$((ERRORS + 1)); }

echo "Chairside App Store release readiness"
echo "======================================"
echo

# Config
if [[ -f "$ROOT/app.json" ]]; then
  fail "Root app.json exists — remove it; use apps/mobile only (see docs/APP_STORE_RELEASE.md)"
else
  ok "No conflicting root app.json"
fi

if grep -q 'com.chairside.app' "$MOBILE/app.json" 2>/dev/null; then
  ok "Bundle ID com.chairside.app in apps/mobile/app.json"
else
  fail "Expected bundle ID com.chairside.app in apps/mobile/app.json"
fi

for route in privacy support terms; do
  if [[ -f "$MOBILE/app/$route.tsx" ]]; then
    ok "Public route /$route"
  else
    fail "Missing apps/mobile/app/$route.tsx"
  fi
done

for doc in APP_STORE_RELEASE.md APP_STORE_CONNECT.md TESTFLIGHT_CHECKLIST.md PUSH_IOS_PRODUCTION.md NOTIFICATIONS.md; do
  if [[ -f "$ROOT/docs/$doc" ]]; then
    ok "docs/$doc"
  else
    fail "Missing docs/$doc"
  fi
done

echo
echo "Manual steps (require your credentials):"
echo "  1. cd apps/mobile && eas env:list --environment production"
echo "  2. supabase functions deploy delete-account notify --use-api"
echo "  3. Configure Pingram APNs — docs/PUSH_IOS_PRODUCTION.md"
echo "  4. pnpm build:ios  →  TestFlight  →  docs/TESTFLIGHT_CHECKLIST.md"
echo "  5. eas submit --profile production --platform ios"
echo "  6. App Store Connect — docs/APP_STORE_CONNECT.md"
echo
echo "Full runbook: docs/APP_STORE_RELEASE.md"
echo

if [[ $ERRORS -gt 0 ]]; then
  echo "$ERRORS check(s) failed."
  exit 1
fi

echo "Repo checks passed. Complete manual steps above before submission."

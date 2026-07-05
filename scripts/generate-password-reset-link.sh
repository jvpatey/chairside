#!/usr/bin/env bash
# Generate a password recovery link without sending email (dev only).
#
# Requires the service_role key — never commit it or ship it in the app.
#
# Usage:
#   export SUPABASE_SERVICE_ROLE_KEY='...'   # Supabase → Project Settings → API
#   export EXPO_PUBLIC_SUPABASE_URL='https://<ref>.supabase.co'   # or apps/mobile/.env
#   ./scripts/generate-password-reset-link.sh you@example.com
#
# Web local dev (default redirect):
#   REDIRECT_TO=http://localhost:8081/auth/callback ./scripts/generate-password-reset-link.sh you@example.com
#
# Native deep link:
#   REDIRECT_TO=chairside://auth/callback ./scripts/generate-password-reset-link.sh you@example.com
#
# Open the printed URL in your browser or paste into the device.

set -euo pipefail

EMAIL="${1:-}"
REDIRECT_TO="${REDIRECT_TO:-http://localhost:8081/auth/callback}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/apps/mobile/.env}"

if [[ -z "$EMAIL" ]]; then
  echo "Usage: $0 <email>" >&2
  echo "Optional: REDIRECT_TO=http://localhost:8081/auth/callback" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    case "$key" in
      EXPO_PUBLIC_SUPABASE_URL)
        [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ]] && EXPO_PUBLIC_SUPABASE_URL="${value}"
        ;;
      SUPABASE_SERVICE_ROLE_KEY)
        [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && SUPABASE_SERVICE_ROLE_KEY="${value}"
        ;;
    esac
  done < <(grep -E '^(EXPO_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' "$ENV_FILE" || true)
fi

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-${SUPABASE_URL:-}}"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Error: export SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role)" >&2
  exit 1
fi

if [[ -z "$SUPABASE_URL" ]]; then
  echo "Error: set EXPO_PUBLIC_SUPABASE_URL in apps/mobile/.env or export it" >&2
  exit 1
fi

RESPONSE="$(
  curl -sS -X POST "${SUPABASE_URL%/}/auth/v1/admin/generate_link" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg email "$EMAIL" \
      --arg redirect "$REDIRECT_TO" \
      '{ type: "recovery", email: $email, options: { redirect_to: $redirect } }')"
)"

if ! ACTION_LINK="$(echo "$RESPONSE" | jq -er '.action_link // empty')" || [[ -z "$ACTION_LINK" ]]; then
  echo "Error generating recovery link:" >&2
  echo "$RESPONSE" | jq . >&2 || echo "$RESPONSE" >&2
  exit 1
fi

echo "Recovery link (no email sent):"
echo "$ACTION_LINK"
echo ""
echo "Redirect target: $REDIRECT_TO"

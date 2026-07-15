#!/usr/bin/env bash
# Smoke-test the notify edge function for clinic manager invitation emails (Pingram /email).
# Usage:
#   export NOTIFY_WEBHOOK_SECRET='...'   # same value as Supabase secret
#   ./scripts/test-clinic-manager-invite-notify.sh [invitation_id] [organization_id] [email]
#
# The payload intentionally omits raw tokens from console output. Replace IDs with real
# pending invitation rows for an end-to-end Pingram send.

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-whdwqvyoikuuggwvvclt}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}}"
INVITATION_ID="${1:-00000000-0000-4000-8000-000000000011}"
ORGANIZATION_ID="${2:-00000000-0000-4000-8000-000000000012}"
EMAIL="${3:-manager-invite-smoke@example.com}"
# Token is sent to the edge function (required) but never printed by this script.
TOKEN="${CLINIC_INVITE_SMOKE_TOKEN:-smoke-token-do-not-log}"

if [[ -z "${NOTIFY_WEBHOOK_SECRET:-}" ]]; then
  echo "Error: export NOTIFY_WEBHOOK_SECRET (Supabase Edge Function secret)" >&2
  exit 1
fi

if [[ -z "$SUPABASE_ANON_KEY" ]]; then
  echo "Error: export SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY" >&2
  exit 1
fi

URL="https://${PROJECT_REF}.supabase.co/functions/v1/notify"
EXPIRES_AT="$(date -u -v+7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)"

PAYLOAD="$(jq -n \
  --arg id "$INVITATION_ID" \
  --arg organization_id "$ORGANIZATION_ID" \
  --arg email "$EMAIL" \
  --arg token "$TOKEN" \
  --arg expires_at "$EXPIRES_AT" \
  '{
    type: "INSERT",
    table: "clinic_invitations",
    schema: "public",
    record: {
      id: $id,
      organization_id: $organization_id,
      email: $email,
      display_name: "Smoke Manager",
      title: "Office Manager",
      role: "manager",
      token: $token,
      location_ids: [],
      status: "pending",
      invited_by_user_id: $organization_id,
      expires_at: $expires_at
    },
    old_record: null
  }')"

SAFE_PAYLOAD="$(echo "$PAYLOAD" | jq 'del(.record.token) | .record.token = "[redacted]"')"

echo "POST $URL"
echo "$SAFE_PAYLOAD" | jq .

HTTP_CODE=$(curl -sS -o /tmp/notify-clinic-invite-response.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "x-supabase-webhook-secret: ${NOTIFY_WEBHOOK_SECRET}" \
  -d "$PAYLOAD")

cat /tmp/notify-clinic-invite-response.json
echo ""
echo "HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" != "200" ]]; then
  exit 1
fi

echo ""
echo "OK: notify accepted clinic_invitations INSERT."
echo "Check:"
echo "  - Supabase function logs (token must not appear)"
echo "  - notification_dispatch_log for clinic_manager_invitation:${INVITATION_ID}"
echo "  - Pingram dashboard email delivery for ${EMAIL}"
echo "Tip: set CLINIC_INVITE_SMOKE_TOKEN to a real pending invitation token for a live send."

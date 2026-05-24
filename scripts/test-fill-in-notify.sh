#!/usr/bin/env bash
# Smoke-test the notify edge function for a live shift post (fill-in SMS path).
# Usage:
#   export NOTIFY_WEBHOOK_SECRET='...'   # same value as Supabase secret
#   ./scripts/test-fill-in-notify.sh [shift_id] [clinic_id] [role_type] [shift_date]
#
# Defaults use placeholder UUIDs — replace with real IDs from your project for a
# meaningful send. With fake IDs the function should still return 200 but send
# to zero recipients (or fail at Pingram if misconfigured).

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-whdwqvyoikuuggwvvclt}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}}"
SHIFT_ID="${1:-00000000-0000-4000-8000-000000000001}"
CLINIC_ID="${2:-00000000-0000-4000-8000-000000000002}"
ROLE_TYPE="${3:-hygienist}"
SHIFT_DATE="${4:-$(date +%Y-%m-%d)}"

if [[ -z "${NOTIFY_WEBHOOK_SECRET:-}" ]]; then
  echo "Error: export NOTIFY_WEBHOOK_SECRET (Supabase Edge Function secret)" >&2
  exit 1
fi

if [[ -z "$SUPABASE_ANON_KEY" ]]; then
  echo "Error: export SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY" >&2
  exit 1
fi

URL="https://${PROJECT_REF}.supabase.co/functions/v1/notify"

PAYLOAD="$(jq -n \
  --arg id "$SHIFT_ID" \
  --arg clinic_id "$CLINIC_ID" \
  --arg role_type "$ROLE_TYPE" \
  --arg shift_date "$SHIFT_DATE" \
  '{
    type: "UPDATE",
    table: "shift_posts",
    schema: "public",
    record: {
      id: $id,
      clinic_id: $clinic_id,
      role_type: $role_type,
      shift_date: $shift_date,
      status: "live"
    },
    old_record: {
      id: $id,
      status: "draft"
    }
  }')"

echo "POST $URL"
echo "$PAYLOAD" | jq .

HTTP_CODE=$(curl -sS -o /tmp/notify-response.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "x-supabase-webhook-secret: ${NOTIFY_WEBHOOK_SECRET}" \
  -d "$PAYLOAD")

cat /tmp/notify-response.json
echo ""
echo "HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" != "200" ]]; then
  exit 1
fi

echo ""
echo "OK: notify accepted. Check Supabase function logs and Pingram dashboard for delivery."
echo "For a real SMS: use a shift_id/clinic_id that exists and a worker with"
echo "  short_notice_available=true, fill_in_sms_opt_in=true, and a valid phone."

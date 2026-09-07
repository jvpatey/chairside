#!/usr/bin/env bash
# Smoke-test the notify edge function for an application shortlist (in_progress).
# Usage:
#   export NOTIFY_WEBHOOK_SECRET='...'   # same value as Supabase secret
#   ./scripts/test-application-notify.sh [application_id] [worker_id]
#
# Use real IDs from your project. The worker must have a row in user_push_tokens
# to receive a native push banner.

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-whdwqvyoikuuggwvvclt}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}}"
APPLICATION_ID="${1:-00000000-0000-4000-8000-000000000021}"
WORKER_ID="${2:-00000000-0000-4000-8000-000000000022}"

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
  --arg id "$APPLICATION_ID" \
  --arg worker_id "$WORKER_ID" \
  '{
    type: "UPDATE",
    table: "applications",
    schema: "public",
    record: {
      id: $id,
      worker_id: $worker_id,
      status: "in_progress",
      job_post_id: "00000000-0000-4000-8000-000000000023"
    },
    old_record: {
      id: $id,
      worker_id: $worker_id,
      status: "applied"
    }
  }')"

echo "POST $URL"
echo "$PAYLOAD" | jq .

HTTP_CODE=$(curl -sS -o /tmp/notify-application-response.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "x-supabase-webhook-secret: ${NOTIFY_WEBHOOK_SECRET}" \
  -d "$PAYLOAD")

cat /tmp/notify-application-response.json
echo ""
echo "HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" != "200" ]]; then
  exit 1
fi

echo ""
echo "OK: notify accepted applications UPDATE (applied -> in_progress)."
echo "Check:"
echo "  - Supabase function logs for expo push skipped/ticket errors"
echo "  - user_push_tokens row for worker ${WORKER_ID}"
echo "  - notification_dispatch_log for application_in_progress:${APPLICATION_ID}:in_progress"
echo "  - the worker device banner + in-app bell"

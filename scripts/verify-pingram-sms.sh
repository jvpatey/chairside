#!/usr/bin/env bash
# Verify Pingram notification types and SMS channel for fill-in alerts.
# Usage:
#   export PINGRAM_API_KEY='pingram_sk_...'
#   ./scripts/verify-pingram-sms.sh

set -euo pipefail

API_BASE="${PINGRAM_API_URL:-https://api.ca.pingram.io}"
FILL_IN_TYPE="${PINGRAM_FILL_IN_TYPE:-fill_in_posted}"

if [[ -z "${PINGRAM_API_KEY:-}" ]]; then
  echo "Error: export PINGRAM_API_KEY='pingram_sk_...'" >&2
  exit 1
fi

echo "Fetching notification types from ${API_BASE}..."
RESPONSE="$(curl -sS -w "\n%{http_code}" \
  -H "Authorization: Bearer ${PINGRAM_API_KEY}" \
  "${API_BASE%/}/types")"

HTTP_CODE="$(echo "$RESPONSE" | tail -n1)"
BODY="$(echo "$RESPONSE" | sed '$d')"

echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo "HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" != "200" ]]; then
  exit 1
fi

SMS_ENABLED="$(echo "$BODY" | jq -r --arg t "$FILL_IN_TYPE" '
  (if type == "array" then . else .data // .types // [] end)
  | map(select((.notificationId // .id // .type) == $t))
  | .[0]
  | .channels[]?
  | select(.channel == "SMS" or . == "SMS")
  | (.enabled // true)
' 2>/dev/null | head -n1)"

if [[ -z "$SMS_ENABLED" || "$SMS_ENABLED" == "null" ]]; then
  echo ""
  echo "WARN: ${FILL_IN_TYPE} SMS channel not found or not enabled."
  echo "In Pingram (app.ca.pingram.io):"
  echo "  1. Open notification type '${FILL_IN_TYPE}'"
  echo "  2. Enable the SMS channel with instant delivery"
  echo "  3. Register an SMS sender with Pingram support (required for Canada/CASL)"
  exit 1
fi

echo ""
echo "OK: ${FILL_IN_TYPE} has SMS channel enabled (${SMS_ENABLED})."

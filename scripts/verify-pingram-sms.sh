#!/usr/bin/env bash
# Verify the Pingram API key, its region, the SMS notification types, and (optionally)
# send a real test SMS that should appear in the Pingram dashboard logs.
# Usage:
#   export PINGRAM_API_KEY='pingram_sk_...'
#   ./scripts/verify-pingram-sms.sh
#   TEST_PHONE='+19025551234' ./scripts/verify-pingram-sms.sh   # also sends a test SMS
#
# Set PINGRAM_API_URL to the same value as the Supabase edge secret (default is the
# Canada region, matching the notify function default).

set -euo pipefail

API_BASE="${PINGRAM_API_URL:-https://api.ca.pingram.io}"
SMS_TYPES=("fill_in_posted" "fill_in_outreach_sms")

if [[ -z "${PINGRAM_API_KEY:-}" ]]; then
  echo "Error: export PINGRAM_API_KEY='pingram_sk_...'" >&2
  exit 1
fi

types_status() {
  curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${PINGRAM_API_KEY}" \
    "${1%/}/types"
}

echo "Checking key against ${API_BASE}..."
HTTP_CODE="$(types_status "$API_BASE")"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "FAIL: ${API_BASE} returned HTTP ${HTTP_CODE} for this key."
  for candidate in https://api.pingram.io https://api.ca.pingram.io https://api.eu.pingram.io; do
    [[ "$candidate" == "${API_BASE%/}" ]] && continue
    if [[ "$(types_status "$candidate")" == "200" ]]; then
      echo "The key works against ${candidate}. Fix with:"
      echo "  supabase secrets set PINGRAM_API_URL=${candidate}"
      exit 1
    fi
  done
  echo "The key was rejected by every region. Create a new key under Environments in the Pingram dashboard."
  exit 1
fi
echo "OK: key is valid for ${API_BASE}"
case "${API_BASE%/}" in
  https://api.ca.pingram.io) DASHBOARD="https://app.ca.pingram.io" ;;
  https://api.eu.pingram.io) DASHBOARD="https://app.eu.pingram.io" ;;
  *) DASHBOARD="https://app.pingram.io" ;;
esac
echo "Sends from this key appear under Logs at ${DASHBOARD}"

BODY="$(curl -sS -H "Authorization: Bearer ${PINGRAM_API_KEY}" "${API_BASE%/}/types")"
MISSING=0
for type in "${SMS_TYPES[@]}"; do
  SMS_ENABLED="$(echo "$BODY" | jq -r --arg t "$type" '
    (if type == "array" then . else .data // .types // [] end)
    | map(select((.notificationId // .id // .type) == $t))
    | .[0]
    | .channels[]?
    | select(.channel == "SMS" or . == "SMS")
    | (.enabled // true)
  ' 2>/dev/null | head -n1)"

  if [[ -z "$SMS_ENABLED" || "$SMS_ENABLED" == "null" ]]; then
    echo "WARN: ${type} is missing or has no SMS channel (run ./scripts/setup-pingram-notification-types.sh)"
    MISSING=1
  else
    echo "OK: ${type} has SMS channel enabled"
  fi
done

if [[ -n "${TEST_PHONE:-}" ]]; then
  echo ""
  echo "Sending test SMS to ${TEST_PHONE}..."
  PAYLOAD="$(jq -n --arg to "$TEST_PHONE" '{
    type: "fill_in_posted",
    to: $to,
    message: "Chairside: test fill-in alert. Reply STOP to opt out."
  }')"
  RESPONSE="$(curl -sS -w "\n%{http_code}" -X POST "${API_BASE%/}/sms" \
    -H "Authorization: Bearer ${PINGRAM_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")"
  SEND_CODE="$(echo "$RESPONSE" | tail -n1)"
  SEND_BODY="$(echo "$RESPONSE" | sed '$d')"
  echo "$SEND_BODY" | jq . 2>/dev/null || echo "$SEND_BODY"
  if [[ "$SEND_CODE" != "200" && "$SEND_CODE" != "202" ]]; then
    echo "FAIL: test SMS returned HTTP ${SEND_CODE}"
    exit 1
  fi
  echo "OK: test SMS accepted. It should now appear in Logs on the Pingram dashboard for this region."
fi

exit "$MISSING"

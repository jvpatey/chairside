#!/usr/bin/env bash
# Create missing Chairside notification types in Pingram (Canada).
# Usage:
#   export PINGRAM_API_KEY='pingram_sk_...'
#   ./scripts/setup-pingram-notification-types.sh

set -euo pipefail

API_BASE="${PINGRAM_API_URL:-https://api.ca.pingram.io}"

if [[ -z "${PINGRAM_API_KEY:-}" ]]; then
  echo "Error: export PINGRAM_API_KEY='pingram_sk_...'" >&2
  exit 1
fi

channel_options() {
  jq -n '{
    INAPP_WEB: {
      defaultDeliveryOption: "instant",
      off: { enabled: false },
      instant: { enabled: true }
    },
    PUSH: {
      defaultDeliveryOption: "instant",
      off: { enabled: false },
      instant: { enabled: true }
    },
    SMS: {
      defaultDeliveryOption: "instant",
      off: { enabled: false },
      instant: { enabled: true }
    }
  }'
}

create_type() {
  local notification_id="$1"
  local title="$2"
  local body
  body="$(jq -n \
    --arg notificationId "$notification_id" \
    --arg title "$title" \
    --argjson options "$(channel_options)" \
    '{
      notificationId: $notificationId,
      title: $title,
      channels: ["INAPP_WEB", "PUSH", "SMS"],
      options: $options
    }')"

  echo "Creating ${notification_id}..."
  HTTP_CODE=$(curl -sS -o /tmp/pingram-create-type.json -w "%{http_code}" \
    -X POST "${API_BASE%/}/types" \
    -H "Authorization: Bearer ${PINGRAM_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$body")

  cat /tmp/pingram-create-type.json
  echo ""
  echo "HTTP $HTTP_CODE"

  if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
    echo "Failed to create ${notification_id}" >&2
    return 1
  fi
}

echo "Using ${API_BASE}"
echo ""

# Only create types Chairside uses that are commonly missing.
for spec in \
  "fill_in_posted|Fill-in posted" \
  "application_rejected|Application rejected" \
  "application_hired|Application hired" \
  "job_posted|Job posted"; do
  id="${spec%%|*}"
  title="${spec#*|}"
  create_type "$id" "$title" || true
  echo ""
done

echo "Done. Re-run ./scripts/verify-pingram-sms.sh to confirm fill_in_posted."

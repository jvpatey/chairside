#!/usr/bin/env bash
# Create Pingram notification types used for email/SMS only.
# Usage:
#   export PINGRAM_API_KEY='pingram_sk_...'
#   ./scripts/setup-pingram-notification-types.sh

set -euo pipefail

API_BASE="${PINGRAM_API_URL:-https://api.ca.pingram.io}"

if [[ -z "${PINGRAM_API_KEY:-}" ]]; then
  echo "Error: export PINGRAM_API_KEY='pingram_sk_...'" >&2
  exit 1
fi

sms_channel_options() {
  jq -n '{
    SMS: {
      defaultDeliveryOption: "instant",
      off: { enabled: false },
      instant: { enabled: true }
    }
  }'
}

email_channel_options() {
  jq -n '{
    EMAIL: {
      defaultDeliveryOption: "instant",
      off: { enabled: false },
      instant: { enabled: true }
    }
  }'
}

create_type() {
  local notification_id="$1"
  local title="$2"
  local channels_json="$3"
  local options_json="$4"
  local body
  body="$(jq -n \
    --arg notificationId "$notification_id" \
    --arg title "$title" \
    --argjson channels "$channels_json" \
    --argjson options "$options_json" \
    '{
      notificationId: $notificationId,
      title: $title,
      channels: $channels,
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
echo "Pingram is email + SMS only (in-app + push are handled by Chairside)."
echo ""

create_type "fill_in_posted" "Fill-in posted" '["SMS"]' "$(sms_channel_options)" || true
echo ""
create_type "fill_in_outreach_sms" "Fill-in outreach SMS" '["SMS"]' "$(sms_channel_options)" || true
echo ""
create_type "clinic_manager_invitation" "Clinic manager invitation" '["EMAIL"]' "$(email_channel_options)" || true
echo ""

echo "Done. Re-run ./scripts/verify-pingram-sms.sh to confirm fill_in_posted."
echo "Manager invites use Pingram POST /email with type clinic_manager_invitation."
echo "Support form email uses type support_contact (see docs/SUPPORT_CONTACT.md)."

/**
 * Product model: SMS-first fill-in coverage with a thin companion app.
 *
 * - SMS discovers and acts (offer → Reply YES → clinic Best Match confirm).
 * - Web/mobile holds details, contact, map, and status — not a browse marketplace.
 * - Permanent roles stay lightweight awareness (`THIN_PERMANENT_ROLES`).
 *
 * YES means “request cover,” not auto-hire. Clinic confirms via
 * `confirm_fill_in_applicant`. Instant Fill (first YES wins) is out of scope.
 */
export const SMS_FIRST_FILL_INS = true;

/**
 * Coverage-network pivot: permanent roles are lightweight awareness listings
 * with simple apply/accept-decline — not the full hiring ATS surface.
 * Roles are not part of the fill-in SMS handshake.
 */
export const THIN_PERMANENT_ROLES = true;

/**
 * Worker Home / Fill-ins prioritize My fill-ins (pending / confirmed) over
 * open-marketplace browse. Open nearby remains a secondary escape hatch.
 */
export const WORKER_STATUS_HUB = true;

/**
 * Ops expectation: production should set `SMS_REPLY_ENABLED=true` on the
 * notify + pingram-sms-inbound edge functions so fill-in texts include
 * `Reply YES ####` (Best Match request) plus a Details `/f/{id}` link.
 * Without the secret, SMS still sends Details links only.
 */
export const SMS_REPLY_EXPECTED_IN_PRODUCTION = true;

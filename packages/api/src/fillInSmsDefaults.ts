/**
 * When a worker saves their first phone number, turn fill-in SMS alerts on.
 * Do not re-enable if they already had a phone (they may have opted out).
 */
export function shouldEnableFillInSmsDefaults(input: {
  nextPhone: string | null | undefined;
  previousPhone: string | null | undefined;
  /** Explicit values on this write — any opt-out skips auto-enable. */
  explicitSmsOptIn?: boolean;
  explicitShortNotice?: boolean;
  explicitNotificationMode?: string | null;
}): boolean {
  const next = typeof input.nextPhone === 'string' ? input.nextPhone.trim() : '';
  if (!next) return false;

  if (input.explicitSmsOptIn === false) return false;
  if (input.explicitShortNotice === false) return false;
  if (input.explicitNotificationMode === 'off') return false;

  const previous = input.previousPhone?.trim() ?? '';
  return previous.length === 0;
}

export const FILL_IN_SMS_DEFAULTS = {
  fill_in_sms_opt_in: true,
  short_notice_available: true,
  fill_in_notification_mode: 'all' as const,
};

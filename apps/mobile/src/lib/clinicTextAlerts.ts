import { authUserHasVerifiedPhone } from '@chairside/api';
import { normalizePhoneForStorage } from '@chairside/config';

import { formatPhoneNumber } from '@/lib/phone';

/**
 * Cover-request texts go to `clinic_profiles.phone`. The number counts as verified only when
 * Auth has confirmed the same digits (Practice details saves the phone without a code).
 */
export function isClinicTextPhoneVerified(
  user: Parameters<typeof authUserHasVerifiedPhone>[0],
  storedPhone: string | null | undefined,
): boolean {
  const trimmed = storedPhone?.trim();
  if (!trimmed) return false;
  const storage = normalizePhoneForStorage(trimmed) ?? trimmed;
  return authUserHasVerifiedPhone(user, storage);
}

export function getClinicTextAlertsSubtitle(input: {
  storedPhone: string | null | undefined;
  verified: boolean;
}): string {
  const trimmed = input.storedPhone?.trim();
  if (!trimmed) return 'Add a number for cover-request texts';
  if (!input.verified) return 'Verify your number to get texts';
  return `Verified · ${formatPhoneNumber(trimmed)}`;
}

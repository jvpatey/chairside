import type { Href } from 'expo-router';

import {
  CLINIC_CAPTURE_ADDRESS,
  CLINIC_CAPTURE_PHONE,
  CLINIC_FINISH_PROFILE,
} from '@/lib/routing';

/**
 * Soft post-gate destination — focused capture screens (no clinic-setup wizard).
 * Mirrors worker soft-gate → finish profile, using the next missing capture step.
 */
export function getClinicPostingSetupHref(missing: string[], _isGroup?: boolean): Href {
  if (missing.includes('Clinic name')) {
    return CLINIC_FINISH_PROFILE;
  }
  if (missing.includes('Phone')) {
    return CLINIC_CAPTURE_PHONE;
  }
  if (
    missing.some(
      (field) =>
        field.includes('Street') ||
        field.includes('City') ||
        field.includes('Postal') ||
        field.includes('location') ||
        field.includes('address'),
    )
  ) {
    return CLINIC_CAPTURE_ADDRESS;
  }
  return CLINIC_FINISH_PROFILE;
}

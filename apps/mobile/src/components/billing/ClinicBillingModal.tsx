import { router } from 'expo-router';

import { CLINIC_PROFILE_BILLING } from '@/lib/routing';

/** Opens the clinic Fill-ins & billing page. */
export function openClinicBillingModal() {
  router.push(CLINIC_PROFILE_BILLING);
}

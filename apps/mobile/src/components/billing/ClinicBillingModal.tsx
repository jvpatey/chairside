import { router, type Href } from 'expo-router';

import type { ClinicBillingScrollFocus } from '@/components/billing/ClinicBillingScreenContent';
import { CLINIC_PROFILE_BILLING } from '@/lib/routing';

export type { ClinicBillingScrollFocus };

type OpenClinicBillingModalOptions = {
  /** Scroll to Group or Clinic plan sections on the billing page. */
  focus?: ClinicBillingScrollFocus;
  /** @deprecated No-op — billing opens as a full page now. */
  onClose?: () => void;
};

/** Opens the clinic Plans & billing page (replaces the old modal sheet). */
export function openClinicBillingModal(options?: OpenClinicBillingModalOptions) {
  const focus = options?.focus;
  if (focus && focus !== 'default') {
    router.push({
      pathname: '/(clinic-tabs)/profile/billing',
      params: { focus },
    } as Href);
    return;
  }
  router.push(CLINIC_PROFILE_BILLING);
}

/** @deprecated No modal host — kept so existing imports compile. */
export function ClinicBillingModalHost() {
  return null;
}

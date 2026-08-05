import type { ClinicProfile, Profile, WorkerProfile } from '@chairside/api';
import type { Href } from 'expo-router';

import { getHomeRouteForRole } from '@/lib/routing';
import { isClinicSetupComplete, isWorkerSetupComplete } from '@/lib/setupCompletion';

export type ChangeRoleGateDecision =
  | { type: 'loading' }
  | { type: 'allow' }
  | { type: 'redirect'; href: Href };

type ChangeRoleGateInput = {
  profile: Profile | null;
  workerProfile: WorkerProfile | null;
  clinicProfile: ClinicProfile | null;
  isWorkerProfileReady: boolean;
  isClinicProfileReady: boolean;
};

/**
 * When correcting worker vs clinic mid-setup, block the role screen if the
 * current role already finished setup (deep link / stale URL safety net).
 */
export function getChangeRoleGateDecision(input: ChangeRoleGateInput): ChangeRoleGateDecision {
  const role = input.profile?.role;
  if (!role) return { type: 'allow' };

  if (role === 'worker') {
    if (!input.isWorkerProfileReady) return { type: 'loading' };
    if (isWorkerSetupComplete(input.workerProfile)) {
      return { type: 'redirect', href: getHomeRouteForRole('worker') };
    }
    return { type: 'allow' };
  }

  if (!input.isClinicProfileReady) return { type: 'loading' };
  if (isClinicSetupComplete(input.clinicProfile)) {
    return { type: 'redirect', href: getHomeRouteForRole('clinic') };
  }
  return { type: 'allow' };
}

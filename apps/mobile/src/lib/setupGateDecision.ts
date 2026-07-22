import type { ClinicProfile, Profile } from '@chairside/api';
import type { Href } from 'expo-router';

import {
  CLINIC_SETUP_ACCOUNT_TYPE,
  CLINIC_SETUP_BASICS,
  getHomeRouteForRole,
  WORKER_SETUP_BASICS,
} from '@/lib/routing';

export type SetupGateDecision =
  | { type: 'loading' }
  | { type: 'redirect'; href: Href }
  | { type: 'children' };

type ClinicGateInput = {
  isAuthReady: boolean;
  session: unknown;
  profile: Profile | null;
  isClinicProfileReady: boolean;
  clinicProfile: ClinicProfile | null;
  membership: unknown;
  isOwner: boolean;
  isClinicGroupsEnabled: boolean;
  isClinicSetupComplete: (profile: ClinicProfile) => boolean;
};

type WorkerGateInput = {
  isAuthReady: boolean;
  session: unknown;
  profile: Profile | null;
  isWorkerProfileReady: boolean;
  workerProfile: { setup_completed_at?: string | null } | null;
  isWorkerSetupComplete: (profile: NonNullable<WorkerGateInput['workerProfile']>) => boolean;
};

export function getClinicSetupGateDecision(input: ClinicGateInput): SetupGateDecision {
  if (!input.isAuthReady) return { type: 'loading' };
  if (!input.session) return { type: 'redirect', href: '/(onboarding)/welcome' };
  if (input.profile === null) {
    return { type: 'redirect', href: '/(onboarding)/role?fromAuth=1' };
  }
  if (input.profile.role !== 'clinic') {
    return { type: 'redirect', href: getHomeRouteForRole('worker') };
  }
  if (!input.isClinicProfileReady) return { type: 'loading' };

  if (input.membership && !input.isOwner) {
    return { type: 'children' };
  }

  if (input.clinicProfile === null) {
    return {
      type: 'redirect',
      href: input.isClinicGroupsEnabled ? CLINIC_SETUP_ACCOUNT_TYPE : CLINIC_SETUP_BASICS,
    };
  }

  if (!input.isClinicSetupComplete(input.clinicProfile)) {
    return {
      type: 'redirect',
      href:
        input.isClinicGroupsEnabled && !input.clinicProfile.account_type
          ? CLINIC_SETUP_ACCOUNT_TYPE
          : CLINIC_SETUP_BASICS,
    };
  }

  return { type: 'children' };
}

export function getWorkerSetupGateDecision(input: WorkerGateInput): SetupGateDecision {
  if (!input.isAuthReady) return { type: 'loading' };
  if (!input.session) return { type: 'redirect', href: '/(onboarding)/welcome' };
  if (input.profile === null) {
    return { type: 'redirect', href: '/(onboarding)/role?fromAuth=1' };
  }
  if (input.profile.role !== 'worker') {
    return { type: 'redirect', href: getHomeRouteForRole('clinic') };
  }
  if (!input.isWorkerProfileReady) return { type: 'loading' };

  if (input.workerProfile === null || !input.isWorkerSetupComplete(input.workerProfile)) {
    return { type: 'redirect', href: WORKER_SETUP_BASICS };
  }

  return { type: 'children' };
}

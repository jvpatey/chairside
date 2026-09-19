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
  session: { user?: { id?: string } } | null | unknown;
  profile: Profile | null;
  /** False while session exists but auth profile fetch has not settled. */
  isProfileReady: boolean;
  isClinicProfileReady: boolean;
  clinicProfile: ClinicProfile | null;
  membership: unknown;
  isOwner: boolean;
  isClinicGroupsEnabled: boolean;
  isClinicSetupComplete: (profile: ClinicProfile) => boolean;
};

type WorkerGateInput = {
  isAuthReady: boolean;
  session: { user?: { id?: string } } | null | unknown;
  profile: Profile | null;
  /** False while session exists but auth profile fetch has not settled. */
  isProfileReady: boolean;
  isWorkerProfileReady: boolean;
  workerProfile: { setup_completed_at?: string | null } | null;
  isWorkerSetupComplete: (profile: NonNullable<WorkerGateInput['workerProfile']>) => boolean;
};

function getSessionUserId(session: unknown): string | null {
  if (typeof session !== 'object' || session === null) return null;
  if (!('user' in session)) return null;
  const user = (session as { user?: unknown }).user;
  if (typeof user !== 'object' || user === null || !('id' in user)) return null;
  const id = (user as { id?: unknown }).id;
  return typeof id === 'string' ? id : null;
}

/** True when a loaded profile belongs to a different user than the live session. */
function isStaleAuthProfile(session: unknown, profile: Profile | null): boolean {
  if (!profile) return false;
  const sessionUserId = getSessionUserId(session);
  return Boolean(sessionUserId && profile.id !== sessionUserId);
}

export function getClinicSetupGateDecision(input: ClinicGateInput): SetupGateDecision {
  if (!input.isAuthReady) return { type: 'loading' };
  if (!input.session) return { type: 'redirect', href: '/(onboarding)/welcome' };
  // Session recovered but profile still loading — do not treat null as "pick role".
  if (!input.isProfileReady) return { type: 'loading' };
  // Previous account's profile must not drive routing after a switch.
  if (isStaleAuthProfile(input.session, input.profile)) return { type: 'loading' };
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
  // Session recovered but profile still loading — do not treat null as "pick role".
  if (!input.isProfileReady) return { type: 'loading' };
  if (isStaleAuthProfile(input.session, input.profile)) return { type: 'loading' };
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

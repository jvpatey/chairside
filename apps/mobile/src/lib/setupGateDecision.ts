import type { ClinicProfile, Profile } from '@chairside/api';
import type { Href } from 'expo-router';

import { getHomeRouteForRole } from '@/lib/routing';

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
  /** Kept for call-site compatibility; profile completeness is soft-gated on post. */
  isClinicSetupComplete: (profile: ClinicProfile) => boolean;
};

type WorkerGateInput = {
  isAuthReady: boolean;
  session: { user?: { id?: string } } | null | unknown;
  profile: Profile | null;
  /** False while session exists but auth profile fetch has not settled. */
  isProfileReady: boolean;
  isWorkerProfileReady: boolean;
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

/**
 * Soft clinic tab gate — mirrors workers. Incomplete clinic profiles are nudged
 * at post time via guardClinicPosting, not blocked from the app shell.
 */
export function getClinicSetupGateDecision(input: ClinicGateInput): SetupGateDecision {
  if (!input.isAuthReady) return { type: 'loading' };
  if (!input.session) return { type: 'redirect', href: '/(onboarding)/welcome' };
  if (!input.isProfileReady) return { type: 'loading' };
  if (isStaleAuthProfile(input.session, input.profile)) return { type: 'loading' };
  if (input.profile === null) {
    return { type: 'redirect', href: '/(onboarding)/role?fromAuth=1' };
  }
  if (input.profile.role !== 'clinic') {
    return { type: 'redirect', href: getHomeRouteForRole('worker') };
  }
  if (!input.isClinicProfileReady) return { type: 'loading' };

  return { type: 'children' };
}

export function getWorkerSetupGateDecision(input: WorkerGateInput): SetupGateDecision {
  if (!input.isAuthReady) return { type: 'loading' };
  if (!input.session) return { type: 'redirect', href: '/(onboarding)/welcome' };
  if (!input.isProfileReady) return { type: 'loading' };
  if (isStaleAuthProfile(input.session, input.profile)) return { type: 'loading' };
  if (input.profile === null) {
    return { type: 'redirect', href: '/(onboarding)/role?fromAuth=1' };
  }
  if (input.profile.role !== 'worker') {
    return { type: 'redirect', href: getHomeRouteForRole('clinic') };
  }
  if (!input.isWorkerProfileReady) return { type: 'loading' };

  return { type: 'children' };
}

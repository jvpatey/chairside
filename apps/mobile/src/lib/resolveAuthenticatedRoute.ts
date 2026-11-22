import {
  getClinicProfile,
  getClinicProfileByOrganizationId,
  getClinicWorkspace,
  isClinicGroupsEnabled,
  resolveAuthProfile,
  type Profile,
  type UserRole,
} from '@chairside/api';
import type { Href } from 'expo-router';

import {
  CLINIC_SETUP_ACCOUNT_TYPE,
  CLINIC_SETUP_BASICS,
  getHomeRouteForRole,
} from '@/lib/routing';
import { isClinicSetupComplete } from '@/lib/setupCompletion';

export {
  canAccessWorkerTabs,
  isClinicSetupComplete,
  isWorkerSetupComplete,
} from '@/lib/setupCompletion';

type ResolveAuthenticatedRouteInput = {
  userId: string;
  profile: Pick<Profile, 'role'> | null;
  refreshProfile: (userId?: string) => Promise<Pick<Profile, 'role'> | null>;
};

type ResolveAuthenticatedRouteResult = {
  href: Href;
  role: UserRole | null;
};

async function resolveHomeRouteForRole(userId: string, role: UserRole): Promise<Href> {
  if (role === 'clinic') {
    if (isClinicGroupsEnabled()) {
      const workspace = await getClinicWorkspace(userId);
      if (workspace) {
        const clinicProfile = await getClinicProfileByOrganizationId(workspace.organization.id);
        if (workspace.membership.role === 'manager') {
          return getHomeRouteForRole('clinic');
        }
        if (!isClinicSetupComplete(clinicProfile)) {
          if (!clinicProfile?.account_type) {
            return CLINIC_SETUP_ACCOUNT_TYPE;
          }
          return CLINIC_SETUP_BASICS;
        }
        return getHomeRouteForRole('clinic');
      }
    }

    const clinicProfile = await getClinicProfile(userId);
    if (!isClinicSetupComplete(clinicProfile)) {
      if (isClinicGroupsEnabled() && !clinicProfile) {
        return CLINIC_SETUP_ACCOUNT_TYPE;
      }
      return CLINIC_SETUP_BASICS;
    }
    return getHomeRouteForRole('clinic');
  }

  // Incomplete workers land in tabs; apply/cover and SMS stay soft-gated.
  return getHomeRouteForRole('worker');
}

export async function resolveAuthenticatedRoute({
  userId,
  profile,
  refreshProfile,
}: ResolveAuthenticatedRouteInput): Promise<ResolveAuthenticatedRouteResult> {
  const resolved = profile?.role ? profile : await resolveAuthProfile(userId);

  if (resolved?.role) {
    if (!profile?.role) {
      await refreshProfile();
    }
    const href = await resolveHomeRouteForRole(userId, resolved.role);
    return { href, role: resolved.role };
  }

  return { href: '/(onboarding)/role?fromAuth=1', role: null };
}

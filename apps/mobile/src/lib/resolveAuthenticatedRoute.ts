import {
  getClinicProfile,
  getClinicProfileByOrganizationId,
  getClinicWorkspace,
  getWorkerProfile,
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
  WORKER_SETUP_BASICS,
} from '@/lib/routing';
import { isClinicSetupComplete, isWorkerSetupComplete } from '@/lib/setupCompletion';

export { isClinicSetupComplete, isWorkerSetupComplete } from '@/lib/setupCompletion';

type ResolveAuthenticatedRouteInput = {
  userId: string;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
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

  const workerProfile = await getWorkerProfile(userId);
  if (!isWorkerSetupComplete(workerProfile)) {
    return WORKER_SETUP_BASICS;
  }
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

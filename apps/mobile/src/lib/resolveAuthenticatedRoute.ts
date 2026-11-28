import {
  resolveAuthProfile,
  type Profile,
  type UserRole,
} from '@chairside/api';
import type { Href } from 'expo-router';

import { getHomeRouteForRole } from '@/lib/routing';

export {
  canAccessClinicTabs,
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

function resolveHomeRouteForRole(role: UserRole): Href {
  // Soft tabs: incomplete clinics land in the app; capture + post gates handle gaps.
  return getHomeRouteForRole(role === 'clinic' ? 'clinic' : 'worker');
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
    const href = resolveHomeRouteForRole(resolved.role);
    return { href, role: resolved.role };
  }

  return { href: '/(onboarding)/role?fromAuth=1', role: null };
}

import { resolveAuthProfile, type Profile, type UserRole } from '@chairside/api';
import type { Href } from 'expo-router';

import { getHomeRouteForRole } from '@/lib/routing';

type ResolveAuthenticatedRouteInput = {
  userId: string;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
};

type ResolveAuthenticatedRouteResult = {
  href: Href;
  role: UserRole | null;
};

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
    return { href: getHomeRouteForRole(resolved.role), role: resolved.role };
  }

  return { href: '/(onboarding)/role?fromAuth=1', role: null };
}

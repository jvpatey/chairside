import { resolveAuthProfile } from '@chairside/api';
import { router } from 'expo-router';

import { isPasswordRecoveryPending } from '@/lib/authRecoveryState';
import { getHomeRouteForRole } from '@/lib/routing';
import type { UserRole } from '@/types';

export async function handleAuthSuccess(
  refreshProfile: () => Promise<{ role: UserRole | null } | null>,
  completeOnboarding: (role: UserRole) => Promise<void>,
  userId: string,
) {
  if (await isPasswordRecoveryPending()) {
    router.replace('/auth/reset-password');
    return;
  }

  const profile = await resolveAuthProfile(userId);
  await refreshProfile();

  if (!profile?.role) {
    router.replace('/(onboarding)/role?fromAuth=1');
    return;
  }

  await completeOnboarding(profile.role);
  router.replace(getHomeRouteForRole(profile.role));
}

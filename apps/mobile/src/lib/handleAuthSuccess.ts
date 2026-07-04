import { resolveAuthProfile } from '@chairside/api';
import { router } from 'expo-router';

import { isPasswordRecoveryPending } from '@/lib/authRecoveryState';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
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
  const refreshed = await refreshProfile();

  const { href, role } = await resolveAuthenticatedRoute({
    userId,
    profile: profile ?? refreshed,
    refreshProfile,
  });

  if (role) {
    await completeOnboarding(role);
  }

  router.replace(href);
}

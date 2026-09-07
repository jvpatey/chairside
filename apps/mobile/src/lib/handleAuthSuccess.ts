import { previewClinicManagerInvitation, resolveAuthProfile, setProfileRole } from '@chairside/api';
import { router } from 'expo-router';

import { isPasswordRecoveryPending } from '@/lib/authRecoveryState';
import {
  buildClinicInviteAcceptHref,
  clearClinicInviteToken,
  readClinicInviteToken,
} from '@/lib/clinicInviteSession';
import {
  clearPendingSignupRole,
  consumePendingSignupRole,
} from '@/lib/pendingSignupRole';
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

  const inviteToken = await readClinicInviteToken();
  if (inviteToken) {
    try {
      const preview = await previewClinicManagerInvitation(inviteToken);
      if (preview.status === 'pending') {
        router.replace(buildClinicInviteAcceptHref(inviteToken));
        return;
      }
      // Revoked / expired / accepted / missing invites must not trap later sign-ins.
      await clearClinicInviteToken();
    } catch {
      // Keep the token and resume the invite screen on transient preview failures.
      router.replace(buildClinicInviteAcceptHref(inviteToken));
      return;
    }
  }

  let profile = await resolveAuthProfile(userId);

  if (!profile?.role) {
    const pendingRole = await consumePendingSignupRole();
    if (pendingRole) {
      profile = await setProfileRole(userId, pendingRole);
    }
  } else {
    await clearPendingSignupRole();
  }

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

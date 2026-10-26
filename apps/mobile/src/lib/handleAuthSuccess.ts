import { previewClinicManagerInvitation, resolveAuthProfile, setProfileRole } from '@chairside/api';
import { router, type Href } from 'expo-router';

import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
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
import {
  clearPendingPublicListingHref,
  consumePendingPublicListingHref,
} from '@/lib/pendingPublicListing';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
import { WORKER_HOME } from '@/lib/routing';
import type { UserRole } from '@/types';

export async function handleAuthSuccess(
  refreshProfile: (userId?: string) => Promise<{ role: UserRole | null } | null>,
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

  const refreshed = await refreshProfile(userId);

  const { href, role } = await resolveAuthenticatedRoute({
    userId,
    profile: profile ?? refreshed,
    refreshProfile: () => refreshProfile(userId),
  });

  if (role) {
    await completeOnboarding(role);
    captureAnalyticsEvent(AnalyticsEvents.authSignedIn, { role });
  }

  if (role === 'worker') {
    const pendingListing = await consumePendingPublicListingHref();
    if (
      pendingListing &&
      (href === WORKER_HOME || String(href).startsWith('/(tabs)'))
    ) {
      router.replace(pendingListing as Href);
      return;
    }
  } else {
    await clearPendingPublicListingHref();
  }

  router.replace(href);
}

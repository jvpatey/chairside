import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { saveClinicInviteToken } from '@/lib/clinicInviteSession';
import { CLINIC_ACCEPT_INVITE } from '@/lib/routing';

/**
 * Public HTTPS / app-link entry for manager invitations.
 * Persists the token and forwards into the onboarding accept screen.
 */
export default function PublicAcceptInviteScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token.trim() : '';

  useEffect(() => {
    if (token) {
      void saveClinicInviteToken(token);
    }
  }, [token]);

  const href = token
    ? (`${String(CLINIC_ACCEPT_INVITE)}?token=${encodeURIComponent(token)}` as const)
    : CLINIC_ACCEPT_INVITE;

  return <Redirect href={href} />;
}

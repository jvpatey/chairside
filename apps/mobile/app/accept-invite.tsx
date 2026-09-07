import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

import { CLINIC_ACCEPT_INVITE } from '@/lib/routing';

/**
 * Public HTTPS / app-link entry for manager invitations.
 * Forwards into the onboarding accept screen. Token persistence happens only
 * after that screen confirms the invite is still pending.
 */
export default function PublicAcceptInviteScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token.trim() : '';

  const href = token
    ? (`${String(CLINIC_ACCEPT_INVITE)}?token=${encodeURIComponent(token)}` as const)
    : CLINIC_ACCEPT_INVITE;

  return <Redirect href={href as Href} />;
}

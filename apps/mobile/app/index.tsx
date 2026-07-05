import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { PageLoadingSpinner } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWebAuthGateReady } from '@/hooks/useWebAuthGateReady';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';

export default function Index() {
  const { isHydrated, completeOnboarding } = useOnboarding();
  const { isAuthReady, session, profile, refreshProfile, isPasswordRecoveryPending } = useAuth();
  const webAuthGateReady = useWebAuthGateReady();
  const [nextRoute, setNextRoute] = useState<Href | null>(null);

  useEffect(() => {
    if (!isHydrated || !isAuthReady || !webAuthGateReady) return;

    let cancelled = false;

    async function resolveRoute() {
      if (isPasswordRecoveryPending) {
        if (!cancelled) setNextRoute('/auth/reset-password');
        return;
      }

      if (!session) {
        if (!cancelled) setNextRoute('/(onboarding)/welcome');
        return;
      }

      if (!profile) {
        return;
      }

      const { href, role } = await resolveAuthenticatedRoute({
        userId: session.user.id,
        profile,
        refreshProfile,
      });

      if (role) {
        await completeOnboarding(role);
      }

      if (!cancelled) setNextRoute(href);
    }

    void resolveRoute();

    return () => {
      cancelled = true;
    };
  }, [
    completeOnboarding,
    isAuthReady,
    isHydrated,
    isPasswordRecoveryPending,
    profile,
    refreshProfile,
    session,
    webAuthGateReady,
  ]);

  if (!isHydrated || !isAuthReady || !webAuthGateReady || !nextRoute) {
    return <PageLoadingSpinner />;
  }

  return <Redirect href={nextRoute} />;
}

import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWebAuthGateReady } from '@/hooks/useWebAuthGateReady';
import { hideBootSplash } from '@/lib/bootSplash';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
import { useTheme } from '@/theme';

export default function Index() {
  const { isHydrated, completeOnboarding } = useOnboarding();
  const { isAuthReady, session, profile, refreshProfile, isPasswordRecoveryPending } = useAuth();
  const webAuthGateReady = useWebAuthGateReady();
  const { colors } = useTheme();
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

      // profile may be null (no role yet) — resolveAuthenticatedRoute handles that.
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

  useEffect(() => {
    if (nextRoute) {
      void hideBootSplash();
    }
  }, [nextRoute]);

  if (!isHydrated || !isAuthReady || !webAuthGateReady || !nextRoute) {
    // Keep splash-matching empty frame — avoids a spinner flash between splash and destination.
    return <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped }} />;
  }

  return <Redirect href={nextRoute} />;
}

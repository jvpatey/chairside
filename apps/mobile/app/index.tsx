import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
import { useTheme } from '@/theme';

export default function Index() {
  const { colors } = useTheme();
  const { isHydrated, completeOnboarding } = useOnboarding();
  const { isAuthReady, session, profile, refreshProfile } = useAuth();
  const [nextRoute, setNextRoute] = useState<Href | null>(null);

  useEffect(() => {
    if (!isHydrated || !isAuthReady) return;

    let cancelled = false;

    async function resolveRoute() {
      if (!session) {
        if (!cancelled) setNextRoute('/(onboarding)/welcome');
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
  }, [completeOnboarding, isAuthReady, isHydrated, profile, refreshProfile, session]);

  if (!isHydrated || !isAuthReady || !nextRoute) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={nextRoute} />;
}

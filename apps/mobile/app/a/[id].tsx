import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { savePendingPublicListingHref } from '@/lib/pendingPublicListing';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  WORKER_HOME,
} from '@/lib/routing';
import { useTheme } from '@/theme';

/**
 * HTTPS deep-link landing for SMS handshake (`/a/{applicationId}`).
 * Routes signed-in clinics and professionals to the same decision/detail screens
 * used by in-app navigation.
 */
export default function ApplicationDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const { session, profile, isAuthReady, isProfileReady } = useAuth();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!applicationId || !isAuthReady) return;

      if (!session?.user?.id) {
        await savePendingPublicListingHref(`/a/${applicationId}`);
        if (!cancelled) {
          router.replace('/(onboarding)/sign-in' as never);
        }
        return;
      }

      if (!isProfileReady) return;

      const role = profile?.role;
      if (role === 'clinic') {
        router.replace(
          getClinicApplicationRoute(applicationId, 'dashboard-fill-ins') as never,
        );
        return;
      }

      if (role === 'worker') {
        router.replace(getWorkerApplicationRoute(applicationId, 'fill-ins-tab') as never);
        return;
      }

      if (!cancelled) {
        router.replace(WORKER_HOME as never);
      }
    }

    void resolve().finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [applicationId, isAuthReady, isProfileReady, profile?.role, session?.user?.id]);

  if (!applicationId) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!ready || !isAuthReady || (session && !isProfileReady)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

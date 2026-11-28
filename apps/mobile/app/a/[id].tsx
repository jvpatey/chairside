import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ClinicCoverDecisionPage } from '@/components/clinic/ClinicCoverDecisionPage';
import { useAuth } from '@/contexts/AuthContext';
import { parseListingOpenSource } from '@/lib/analytics/events';
import { savePendingPublicListingHref } from '@/lib/pendingPublicListing';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  WORKER_HOME,
} from '@/lib/routing';
import { useTheme } from '@/theme';

/**
 * HTTPS deep-link landing for SMS handshake (`/a/{applicationId}`).
 * With `?t=` token: Companion Accept page (no login required).
 * Without token: routes signed-in clinics/workers to in-app detail screens.
 */
export default function ApplicationDeepLinkScreen() {
  const { id, t, src } = useLocalSearchParams<{ id?: string; t?: string; src?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const token = typeof t === 'string' ? t.trim() : '';
  const source = parseListingOpenSource(src);
  const { session, profile, isAuthReady, isProfileReady } = useAuth();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // Tokenized companion Accept — no auth redirect.
      if (token) {
        if (!cancelled) setReady(true);
        return;
      }

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
  }, [applicationId, isAuthReady, isProfileReady, profile?.role, session?.user?.id, token]);

  if (!applicationId) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (token) {
    return (
      <ClinicCoverDecisionPage
        applicationId={applicationId}
        token={token}
        source={source}
      />
    );
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

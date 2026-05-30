import { createSessionFromUrl } from '@chairside/api';
import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useTheme } from '@/theme';

async function resolveCallbackUrl() {
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl?.includes('auth/callback')) {
    return initialUrl;
  }

  return new Promise<string | null>((resolve) => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth/callback')) {
        subscription.remove();
        resolve(url);
      }
    });

    setTimeout(() => {
      subscription.remove();
      resolve(null);
    }, 5000);
  });
}

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const url = await resolveCallbackUrl();
        if (!url) {
          throw new Error('No authentication callback URL found.');
        }

        const { session, isPasswordRecovery } = await createSessionFromUrl(url);
        if (cancelled) return;

        if (!session?.user) {
          throw new Error('No authenticated user found.');
        }

        if (isPasswordRecovery) {
          router.replace('/auth/reset-password');
          return;
        }

        await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [completeOnboarding, refreshProfile]);

  if (failed) {
    return <Redirect href="/(onboarding)/sign-in" />;
  }

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

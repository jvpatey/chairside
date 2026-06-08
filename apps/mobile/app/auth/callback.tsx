import { createSessionFromUrl, getSupabaseClient } from '@chairside/api';
import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { PageLoadingSpinner } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';

async function resolveCallbackUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const href = window.location.href;
    if (href.includes('auth/callback')) {
      return href;
    }
  }

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
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/auth/reset-password');
      }
    });

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
      subscription.unsubscribe();
    };
  }, [completeOnboarding, refreshProfile]);

  if (failed) {
    return <Redirect href="/(onboarding)/sign-in" />;
  }

  return <PageLoadingSpinner message="Signing you in…" />;
}

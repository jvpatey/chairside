import { hasAuthCallbackParams, isAuthCallbackPath } from '@chairside/api';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { PageLoadingSpinner } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { processAuthCallbackLink } from '@/lib/processAuthCallbackLink';
import { hasWebAuthLinkBeenHandled } from '@/lib/webAuthCallbackGate';

function resolveWebCallbackUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const href = window.location.href;
  if (isAuthCallbackPath(window.location.pathname) || hasAuthCallbackParams(href)) {
    return href;
  }

  return null;
}

async function resolveNativeCallbackUrl() {
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
  const { refreshProfile, markPasswordRecoveryPending } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [isClientReady, setIsClientReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsClientReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isClientReady) return;

    if (Platform.OS === 'web' && hasWebAuthLinkBeenHandled()) {
      return;
    }

    let cancelled = false;

    async function handleCallback() {
      const url =
        Platform.OS === 'web' ? resolveWebCallbackUrl() : await resolveNativeCallbackUrl();

      if (!url || cancelled) return;

      await processAuthCallbackLink(url, {
        refreshProfile,
        completeOnboarding,
        markRecoveryInContext: markPasswordRecoveryPending,
      });
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [completeOnboarding, isClientReady, markPasswordRecoveryPending, refreshProfile]);

  return <PageLoadingSpinner message="Opening secure link…" />;
}

import {
  getWebAuthCallbackHref,
  hasAuthCallbackParams,
  isAuthCallbackPath,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useLayoutEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { processAuthCallbackLink } from '@/lib/processAuthCallbackLink';
import {
  hasWebAuthLinkBeenHandled,
  setWebAuthGateStatus,
} from '@/lib/webAuthCallbackGate';

/** Processes Supabase auth tokens on whatever URL they land, before route redirects. */
export function WebAuthCallbackHandler() {
  const { refreshProfile, markPasswordRecoveryPending } = useAuth();
  const { completeOnboarding } = useOnboarding();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasWebAuthLinkBeenHandled()) {
      setWebAuthGateStatus('idle');
      return;
    }

    const href = window.location.href;
    if (!hasAuthCallbackParams(href)) {
      setWebAuthGateStatus('idle');
      return;
    }

    setWebAuthGateStatus('processing');

    // Move Expo Router onto the callback screen (not just the browser URL) so
    // index cannot paint the dashboard while the code exchange runs.
    if (!isAuthCallbackPath(window.location.pathname)) {
      const callbackHref = getWebAuthCallbackHref(href);
      if (callbackHref) {
        router.replace(callbackHref as Href);
      }
    }

    void processAuthCallbackLink(href, {
      refreshProfile,
      completeOnboarding,
      markRecoveryInContext: markPasswordRecoveryPending,
    }).finally(() => {
      setWebAuthGateStatus('idle');
    });
  }, [completeOnboarding, markPasswordRecoveryPending, refreshProfile]);

  return null;
}

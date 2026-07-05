import {
  getWebAuthCallbackHref,
  hasAuthCallbackParams,
  isAuthCallbackPath,
} from '@chairside/api';
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

    if (!isAuthCallbackPath(window.location.pathname)) {
      const callbackHref = getWebAuthCallbackHref(href);
      if (callbackHref) {
        window.history.replaceState(null, '', callbackHref);
      }
    }

    void processAuthCallbackLink(window.location.href, {
      refreshProfile,
      completeOnboarding,
      markRecoveryInContext: markPasswordRecoveryPending,
    }).finally(() => {
      setWebAuthGateStatus('idle');
    });
  }, [completeOnboarding, markPasswordRecoveryPending, refreshProfile]);

  return null;
}

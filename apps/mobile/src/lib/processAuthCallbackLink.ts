import {
  createSessionFromUrl,
  getSupabaseClient,
  isPasswordRecoveryUrl,
} from '@chairside/api';
import { router } from 'expo-router';

import {
  clearPasswordRecoveryPending,
  markPasswordRecoveryPending,
} from '@/lib/authRecoveryState';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { markWebAuthLinkHandled } from '@/lib/webAuthCallbackGate';
import type { UserRole } from '@/types';

function stripAuthParamsFromBrowserUrl() {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname);
}

type ProcessAuthCallbackDeps = {
  refreshProfile: () => Promise<{ role: UserRole | null } | null>;
  completeOnboarding: (role: UserRole) => Promise<void>;
  markRecoveryInContext: () => void;
};

export async function processAuthCallbackLink(
  url: string,
  { refreshProfile, completeOnboarding, markRecoveryInContext }: ProcessAuthCallbackDeps,
): Promise<void> {
  markWebAuthLinkHandled();

  let isRecoveryAttempt = false;
  let recoveryRouted = false;

  const routeToPasswordReset = () => {
    if (recoveryRouted) return;
    recoveryRouted = true;
    void markPasswordRecoveryPending();
    markRecoveryInContext();
    router.replace('/auth/reset-password');
  };

  const routeToSignInWithError = (authError: string) => {
    void clearPasswordRecoveryPending();
    router.replace({
      pathname: '/(onboarding)/sign-in',
      params: { authError },
    });
  };

  const supabase = getSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      routeToPasswordReset();
    }
  });

  try {
    isRecoveryAttempt = isPasswordRecoveryUrl(url);
    const { session, isPasswordRecovery } = await createSessionFromUrl(url);
    stripAuthParamsFromBrowserUrl();

    if (isPasswordRecovery || isRecoveryAttempt) {
      if (!session?.user) {
        throw new Error('No authenticated user found for password recovery.');
      }
      routeToPasswordReset();
      return;
    }

    if (recoveryRouted) return;

    if (!session?.user) {
      throw new Error('No authenticated user found.');
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
    if (recoveryRouted) return;

    await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
  } catch {
    routeToSignInWithError(isRecoveryAttempt ? 'reset-link-expired' : 'sign-in-failed');
  } finally {
    subscription.unsubscribe();
  }
}

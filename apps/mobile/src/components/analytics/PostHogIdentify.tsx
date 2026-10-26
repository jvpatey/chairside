import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { identifyAnalyticsUser, resetAnalyticsUser } from '@/lib/analytics/posthog';

/** Keeps PostHog person identity in sync with Supabase auth. */
export function PostHogIdentify() {
  const { isAuthReady, user, profile } = useAuth();
  const lastIdentifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    const userId = user?.id ?? null;
    if (!userId) {
      if (lastIdentifiedIdRef.current) {
        resetAnalyticsUser();
        lastIdentifiedIdRef.current = null;
      }
      return;
    }

    if (lastIdentifiedIdRef.current === userId && !profile?.role) return;

    identifyAnalyticsUser(userId, {
      role: profile?.role ?? null,
    });
    lastIdentifiedIdRef.current = userId;
  }, [isAuthReady, user?.id, profile?.role]);

  return null;
}

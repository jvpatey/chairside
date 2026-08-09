import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { DashboardWelcomeRole } from '@/lib/dashboardWelcomeCopy';
import {
  hasDashboardWelcomeBeenShown,
  markDashboardWelcomeShown,
  shouldShowDashboardWelcome,
} from '@/lib/dashboardWelcomeStorage';
import { CLINIC_HOME, WORKER_HOME } from '@/lib/routing';

type UseDashboardWelcomeCelebrationOptions = {
  role: DashboardWelcomeRole;
  userId: string | null | undefined;
};

export function useDashboardWelcomeCelebration({
  role,
  userId,
}: UseDashboardWelcomeCelebrationOptions) {
  const { welcome } = useLocalSearchParams<{ welcome?: string | string[] }>();
  const [hasShown, setHasShown] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setHasShown(false);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;

    async function hydrate() {
      try {
        const shown = await hasDashboardWelcomeBeenShown(role, userId);
        if (!cancelled) {
          setHasShown(shown);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    setIsHydrated(false);
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  const visible = shouldShowDashboardWelcome({
    welcomeParam: welcome,
    hasShown,
    isHydrated,
    userId,
  });

  const dismiss = useCallback(async () => {
    if (userId) {
      await markDashboardWelcomeShown(role, userId);
    }
    setHasShown(true);
    router.replace(role === 'clinic' ? CLINIC_HOME : WORKER_HOME);
  }, [role, userId]);

  return {
    visible,
    dismiss,
  };
}

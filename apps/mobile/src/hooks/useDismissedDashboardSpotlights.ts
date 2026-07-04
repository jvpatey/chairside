import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  DASHBOARD_SPOTLIGHT_DISMISS_KEYS,
  type DashboardSpotlightRole,
} from '@/lib/dashboardSpotlightDismiss';

function parseDismissedIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

/** Persists dismissed dashboard spotlight item ids per role. */
export function useDismissedDashboardSpotlights(role: DashboardSpotlightRole) {
  const storageKey = DASHBOARD_SPOTLIGHT_DISMISS_KEYS[role];
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!cancelled) {
          setDismissedIds(parseDismissedIds(raw));
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(
    async (id: string) => {
      setDismissedIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        void AsyncStorage.setItem(storageKey, JSON.stringify([...next]));
        return next;
      });
    },
    [storageKey],
  );

  return { isHydrated, dismissedIds, dismiss };
}

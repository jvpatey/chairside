import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  parseDismissedScreeningReviewIds,
  SCREENING_REVIEW_DISMISS_KEY,
} from '@/lib/screeningReviewDismiss';

/** Persists clinic screening-response review dismissals per application id. */
export function useDismissedScreeningReviews() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(SCREENING_REVIEW_DISMISS_KEY);
        if (!cancelled) {
          setDismissedIds(parseDismissedScreeningReviewIds(raw));
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
  }, []);

  const dismiss = useCallback(async (applicationId: string) => {
    setDismissedIds((current) => {
      if (current.has(applicationId)) return current;
      const next = new Set(current);
      next.add(applicationId);
      void AsyncStorage.setItem(SCREENING_REVIEW_DISMISS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { isHydrated, dismissedIds, dismiss };
}

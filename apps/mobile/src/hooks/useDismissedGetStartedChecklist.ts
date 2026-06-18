import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  GET_STARTED_DISMISS_KEYS,
  type GetStartedRole,
} from '@/lib/getStartedChecklist';

export function useDismissedGetStartedChecklist(role: GetStartedRole) {
  const storageKey = GET_STARTED_DISMISS_KEYS[role];
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const value = await AsyncStorage.getItem(storageKey);
        if (!cancelled) {
          setIsDismissed(value === 'true');
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

  const dismiss = useCallback(async () => {
    setIsDismissed(true);
    await AsyncStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  return { isHydrated, isDismissed, dismiss };
}

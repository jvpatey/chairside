import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  getFillInNudgeSnoozeKey,
  parseFillInNudgeSnooze,
  type FillInNudgeSnooze,
  type FillInNudgeState,
} from '@/lib/fillInNudge';

export function useFillInNudgeSnooze(userId: string | null | undefined) {
  const [snooze, setSnooze] = useState<FillInNudgeSnooze | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSnooze(null);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    setIsHydrated(false);

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(getFillInNudgeSnoozeKey(userId as string));
        if (!cancelled) setSnooze(parseFillInNudgeSnooze(raw));
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const snoozeState = useCallback(
    async (state: FillInNudgeState) => {
      const next: FillInNudgeSnooze = { state, snoozedAt: Date.now() };
      setSnooze(next);
      if (userId) {
        await AsyncStorage.setItem(getFillInNudgeSnoozeKey(userId), JSON.stringify(next));
      }
    },
    [userId],
  );

  return { snooze, isHydrated, snoozeState };
}

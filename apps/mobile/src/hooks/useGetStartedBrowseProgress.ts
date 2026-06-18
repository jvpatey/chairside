import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  GET_STARTED_BROWSE_KEYS,
  type WorkerBrowseSection,
} from '@/lib/getStartedChecklist';

export async function markGetStartedBrowseVisited(section: WorkerBrowseSection) {
  await AsyncStorage.setItem(GET_STARTED_BROWSE_KEYS[section], 'true');
}

export function useGetStartedBrowseProgress() {
  const [visitedRoles, setVisitedRoles] = useState(false);
  const [visitedFillIns, setVisitedFillIns] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [roles, fillIns] = await Promise.all([
        AsyncStorage.getItem(GET_STARTED_BROWSE_KEYS.roles),
        AsyncStorage.getItem(GET_STARTED_BROWSE_KEYS.fillIns),
      ]);
      setVisitedRoles(roles === 'true');
      setVisitedFillIns(fillIns === 'true');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { visitedRoles, visitedFillIns, isHydrated, refresh };
}

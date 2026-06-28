import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import {
  GET_STARTED_BROWSE_KEYS,
  type WorkerBrowseSection,
} from '@/lib/getStartedChecklist';

type GetStartedBrowseProgressContextValue = {
  visitedRoles: boolean;
  visitedFillIns: boolean;
  isHydrated: boolean;
  refresh: () => Promise<void>;
  markVisited: (section: WorkerBrowseSection) => Promise<void>;
};

const GetStartedBrowseProgressContext =
  createContext<GetStartedBrowseProgressContextValue | null>(null);

export function getGetStartedBrowseStorageKey(
  section: WorkerBrowseSection,
  userId: string,
): string {
  return `${GET_STARTED_BROWSE_KEYS[section]}:${userId}`;
}

async function readBrowseVisitedFlag(
  section: WorkerBrowseSection,
  userId: string,
): Promise<boolean> {
  const scopedKey = getGetStartedBrowseStorageKey(section, userId);
  const scopedValue = await AsyncStorage.getItem(scopedKey);
  if (scopedValue === 'true') {
    return true;
  }

  const legacyValue = await AsyncStorage.getItem(GET_STARTED_BROWSE_KEYS[section]);
  if (legacyValue !== 'true') {
    return false;
  }

  await AsyncStorage.setItem(scopedKey, 'true');
  await AsyncStorage.removeItem(GET_STARTED_BROWSE_KEYS[section]);
  return true;
}

export function GetStartedBrowseProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [visitedRoles, setVisitedRoles] = useState(false);
  const [visitedFillIns, setVisitedFillIns] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setVisitedRoles(false);
      setVisitedFillIns(false);
      setIsHydrated(true);
      return;
    }

    try {
      const [roles, fillIns] = await Promise.all([
        readBrowseVisitedFlag('roles', userId),
        readBrowseVisitedFlag('fillIns', userId),
      ]);
      setVisitedRoles(roles);
      setVisitedFillIns(fillIns);
    } finally {
      setIsHydrated(true);
    }
  }, [userId]);

  const markVisited = useCallback(
    async (section: WorkerBrowseSection) => {
      if (!userId) return;

      const key = getGetStartedBrowseStorageKey(section, userId);
      await AsyncStorage.setItem(key, 'true');
      if (section === 'roles') {
        setVisitedRoles(true);
      } else {
        setVisitedFillIns(true);
      }
    },
    [userId],
  );

  useEffect(() => {
    setIsHydrated(false);
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      visitedRoles,
      visitedFillIns,
      isHydrated,
      refresh,
      markVisited,
    }),
    [visitedRoles, visitedFillIns, isHydrated, refresh, markVisited],
  );

  return (
    <GetStartedBrowseProgressContext.Provider value={value}>
      {children}
    </GetStartedBrowseProgressContext.Provider>
  );
}

export function useGetStartedBrowseProgress() {
  const ctx = useContext(GetStartedBrowseProgressContext);
  if (!ctx) {
    throw new Error(
      'useGetStartedBrowseProgress must be used within GetStartedBrowseProgressProvider',
    );
  }
  return ctx;
}

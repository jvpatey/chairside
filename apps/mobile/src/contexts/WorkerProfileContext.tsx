import {
  getWorkerProfile,
  isWorkerProfileComplete,
  listAvailabilityBlocks,
  type AvailabilityBlock,
  type WorkerProfile,
} from '@chairside/api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';

type WorkerProfileContextValue = {
  workerProfile: WorkerProfile | null;
  availabilityBlocks: AvailabilityBlock[];
  isWorkerProfileReady: boolean;
  isProfileComplete: boolean;
  refreshWorkerProfile: () => Promise<WorkerProfile | null>;
  refreshAvailabilityBlocks: () => Promise<AvailabilityBlock[]>;
};

const WorkerProfileContext = createContext<WorkerProfileContextValue | null>(null);

export function WorkerProfileProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthReady } = useAuth();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [isWorkerProfileReady, setIsWorkerProfileReady] = useState(false);
  const requestRef = useRef(0);

  const refreshWorkerProfile = useCallback(async () => {
    const userId = user?.id;
    if (!userId || profile?.role !== 'worker') {
      setWorkerProfile(null);
      return null;
    }

    const requestId = ++requestRef.current;

    try {
      const nextProfile = await getWorkerProfile(userId);
      if (requestId !== requestRef.current) return null;
      setWorkerProfile(nextProfile);
      return nextProfile;
    } catch {
      if (requestId === requestRef.current) setWorkerProfile(null);
      return null;
    }
  }, [user?.id, profile?.role]);

  const refreshAvailabilityBlocks = useCallback(async () => {
    const userId = user?.id;
    if (!userId || profile?.role !== 'worker') {
      setAvailabilityBlocks([]);
      return [];
    }

    try {
      const blocks = await listAvailabilityBlocks(userId);
      setAvailabilityBlocks(blocks);
      return blocks;
    } catch {
      setAvailabilityBlocks([]);
      return [];
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthReady) {
        setIsWorkerProfileReady(false);
        return;
      }

      if (!user?.id) {
        requestRef.current += 1;
        setWorkerProfile(null);
        setAvailabilityBlocks([]);
        setIsWorkerProfileReady(true);
        return;
      }

      if (profile === null) {
        // Auth settled with no profile row — treat as ready so gates can redirect.
        requestRef.current += 1;
        setWorkerProfile(null);
        setAvailabilityBlocks([]);
        setIsWorkerProfileReady(true);
        return;
      }

      if (profile.role !== 'worker') {
        requestRef.current += 1;
        setWorkerProfile(null);
        setAvailabilityBlocks([]);
        setIsWorkerProfileReady(true);
        return;
      }

      const requestId = ++requestRef.current;
      setIsWorkerProfileReady(false);

      try {
        const [nextProfile, blocks] = await Promise.all([
          getWorkerProfile(user.id),
          listAvailabilityBlocks(user.id),
        ]);
        if (cancelled || requestId !== requestRef.current) return;
        setWorkerProfile(nextProfile);
        setAvailabilityBlocks(blocks);
      } catch {
        if (!cancelled && requestId === requestRef.current) {
          setWorkerProfile(null);
          setAvailabilityBlocks([]);
        }
      } finally {
        if (!cancelled) setIsWorkerProfileReady(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      requestRef.current += 1;
    };
  }, [user?.id, profile, profile?.role, isAuthReady]);

  const value = useMemo(
    () => ({
      workerProfile,
      availabilityBlocks,
      isWorkerProfileReady,
      isProfileComplete: isWorkerProfileComplete(workerProfile),
      refreshWorkerProfile,
      refreshAvailabilityBlocks,
    }),
    [
      workerProfile,
      availabilityBlocks,
      isWorkerProfileReady,
      refreshWorkerProfile,
      refreshAvailabilityBlocks,
    ],
  );

  return (
    <WorkerProfileContext.Provider value={value}>{children}</WorkerProfileContext.Provider>
  );
}

export function useWorkerProfile(): WorkerProfileContextValue {
  const context = useContext(WorkerProfileContext);
  if (!context) {
    throw new Error('useWorkerProfile must be used within WorkerProfileProvider');
  }
  return context;
}

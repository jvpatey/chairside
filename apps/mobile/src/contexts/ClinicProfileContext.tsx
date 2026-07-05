import {
  getClinicProfile,
  isClinicProfileComplete,
  type ClinicProfile,
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

type ClinicProfileContextValue = {
  clinicProfile: ClinicProfile | null;
  isClinicProfileReady: boolean;
  isProfileComplete: boolean;
  refreshClinicProfile: () => Promise<ClinicProfile | null>;
};

const ClinicProfileContext = createContext<ClinicProfileContextValue | null>(null);

export function ClinicProfileProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthReady } = useAuth();
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
  const [isClinicProfileReady, setIsClinicProfileReady] = useState(false);
  const requestRef = useRef(0);

  const refreshClinicProfile = useCallback(async () => {
    const userId = user?.id;
    if (!userId || profile?.role !== 'clinic') {
      setClinicProfile(null);
      return null;
    }

    const requestId = ++requestRef.current;

    try {
      const nextProfile = await getClinicProfile(userId);
      if (requestId !== requestRef.current) return null;
      setClinicProfile(nextProfile);
      return nextProfile;
    } catch {
      if (requestId === requestRef.current) setClinicProfile(null);
      return null;
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthReady) {
        setIsClinicProfileReady(false);
        return;
      }

      if (!user?.id) {
        requestRef.current += 1;
        setClinicProfile(null);
        setIsClinicProfileReady(true);
        return;
      }

      if (profile === null) {
        setClinicProfile(null);
        setIsClinicProfileReady(false);
        return;
      }

      if (profile.role !== 'clinic') {
        requestRef.current += 1;
        setClinicProfile(null);
        setIsClinicProfileReady(true);
        return;
      }

      const requestId = ++requestRef.current;
      setIsClinicProfileReady(false);

      try {
        const nextProfile = await getClinicProfile(user.id);
        if (cancelled || requestId !== requestRef.current) return;
        setClinicProfile(nextProfile);
      } catch {
        if (!cancelled && requestId === requestRef.current) {
          setClinicProfile(null);
        }
      } finally {
        if (!cancelled) setIsClinicProfileReady(true);
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
      clinicProfile,
      isClinicProfileReady,
      isProfileComplete: isClinicProfileComplete(clinicProfile),
      refreshClinicProfile,
    }),
    [clinicProfile, isClinicProfileReady, refreshClinicProfile],
  );

  return (
    <ClinicProfileContext.Provider value={value}>{children}</ClinicProfileContext.Provider>
  );
}

export function useClinicProfile(): ClinicProfileContextValue {
  const context = useContext(ClinicProfileContext);
  if (!context) {
    throw new Error('useClinicProfile must be used within ClinicProfileProvider');
  }
  return context;
}

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

import type { UserRole } from '@/types';

const STORAGE_KEYS = {
  complete: 'chairside.onboarding.complete',
  role: 'chairside.user.role',
} as const;

type OnboardingContextValue = {
  userRole: UserRole | null;
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  completeOnboarding: (role: UserRole) => Promise<void>;
  /** Dev / Profile later: clear onboarding and return to welcome. */
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function isUserRole(value: string | null): value is UserRole {
  return value === 'worker' || value === 'clinic';
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [complete, role] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.complete),
          AsyncStorage.getItem(STORAGE_KEYS.role),
        ]);

        if (cancelled) return;

        setHasCompletedOnboarding(complete === 'true');
        setUserRole(isUserRole(role) ? role : null);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async (role: UserRole) => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.complete, 'true'),
      AsyncStorage.setItem(STORAGE_KEYS.role, role),
    ]);
    setUserRole(role);
    setHasCompletedOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.complete),
      AsyncStorage.removeItem(STORAGE_KEYS.role),
    ]);
    setUserRole(null);
    setHasCompletedOnboarding(false);
  }, []);

  const value = useMemo(
    () => ({
      userRole,
      hasCompletedOnboarding,
      isHydrated,
      completeOnboarding,
      resetOnboarding,
    }),
    [userRole, hasCompletedOnboarding, isHydrated, completeOnboarding, resetOnboarding],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

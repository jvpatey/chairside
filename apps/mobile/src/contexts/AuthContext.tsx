import {
  getSupabaseClient,
  resolveAuthProfile,
  signOut as apiSignOut,
  type Profile,
} from '@chairside/api';
import type { Session, User } from '@supabase/supabase-js';
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

import {
  clearPasswordRecoveryPending,
  isPasswordRecoveryPending,
  markPasswordRecoveryPending,
} from '@/lib/authRecoveryState';
import { applyAuthSessionFromStorage } from '@/lib/authSessionSync';
import { unregisterPingramPushNotifications } from '@/lib/pingramPushRegistration';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthReady: boolean;
  isPasswordRecoveryPending: boolean;
  refreshProfile: () => Promise<Profile | null>;
  markPasswordRecoveryPending: () => void;
  clearPasswordRecoveryPending: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPasswordRecoveryPendingState, setIsPasswordRecoveryPendingState] = useState(false);
  const profileRequestRef = useRef(0);
  const signingOutRef = useRef(false);

  const markRecoveryPending = useCallback(() => {
    setIsPasswordRecoveryPendingState(true);
  }, []);

  const clearRecoveryPending = useCallback(async () => {
    await clearPasswordRecoveryPending();
    setIsPasswordRecoveryPendingState(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabaseClient();
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();
    const userId = user?.id ?? activeSession?.user?.id;
    if (!userId) {
      setProfile(null);
      return null;
    }

    const requestId = ++profileRequestRef.current;

    try {
      const nextProfile = await resolveAuthProfile(userId);
      if (requestId !== profileRequestRef.current) return null;
      setProfile(nextProfile);
      return nextProfile;
    } catch {
      if (requestId === profileRequestRef.current) setProfile(null);
      return null;
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(userId: string, requestId: number) {
      try {
        const nextProfile = await resolveAuthProfile(userId);
        if (cancelled || requestId !== profileRequestRef.current) return;
        setProfile(nextProfile);
      } catch {
        if (!cancelled && requestId === profileRequestRef.current) {
          setProfile(null);
        }
      }
    }

    async function applySessionFromStorage() {
      await applyAuthSessionFromStorage({
        getSession: async () => {
          const supabase = getSupabaseClient();
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();
          return { session: currentSession, error: error ? new Error(error.message) : null };
        },
        isCancelled: () => cancelled,
        nextProfileRequestId: () => ++profileRequestRef.current,
        loadProfile,
        setSession,
        setUser,
        clearProfile: () => {
          profileRequestRef.current += 1;
          setProfile(null);
        },
      });
    }

    async function bootstrapAuth() {
      try {
        const recoveryPending = await isPasswordRecoveryPending();
        if (!cancelled) {
          setIsPasswordRecoveryPendingState(recoveryPending);
        }

        await applySessionFromStorage();
      } catch {
        if (!cancelled) {
          profileRequestRef.current += 1;
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    }

    bootstrapAuth();

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = getSupabaseClient();
      const result = supabase.auth.onAuthStateChange((event) => {
        if (signingOutRef.current && event !== 'SIGNED_OUT') {
          return;
        }

        if (event === 'SIGNED_OUT') {
          profileRequestRef.current += 1;
          setSession(null);
          setUser(null);
          setProfile(null);
          void clearPasswordRecoveryPending();
          setIsPasswordRecoveryPendingState(false);
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          void markPasswordRecoveryPending();
          setIsPasswordRecoveryPendingState(true);
        }

        void applySessionFromStorage();
      });
      subscription = result.data.subscription;
    } catch {
      if (!cancelled) setIsAuthReady(true);
    }

    return () => {
      cancelled = true;
      profileRequestRef.current += 1;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const userId = user?.id;
    profileRequestRef.current += 1;
    signingOutRef.current = true;

    try {
      if (userId) {
        await unregisterPingramPushNotifications(userId);
      }
      await clearRecoveryPending();
      await apiSignOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      signingOutRef.current = false;
    }
  }, [clearRecoveryPending, user?.id]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isAuthReady,
      isPasswordRecoveryPending: isPasswordRecoveryPendingState,
      refreshProfile,
      markPasswordRecoveryPending: markRecoveryPending,
      clearPasswordRecoveryPending: clearRecoveryPending,
      signOut,
    }),
    [
      session,
      user,
      profile,
      isAuthReady,
      isPasswordRecoveryPendingState,
      refreshProfile,
      markRecoveryPending,
      clearRecoveryPending,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

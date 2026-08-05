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
  /** False while a session exists but profile fetch has not settled yet. */
  isProfileReady: boolean;
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
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isPasswordRecoveryPendingState, setIsPasswordRecoveryPendingState] = useState(false);
  const profileRequestRef = useRef(0);
  const signingOutRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const isProfileReadyRef = useRef(false);
  const applyGenerationRef = useRef(0);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    isProfileReadyRef.current = isProfileReady;
  }, [isProfileReady]);

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
      setIsProfileReady(true);
      return null;
    }

    const requestId = ++profileRequestRef.current;
    setIsProfileReady(false);

    try {
      const nextProfile = await resolveAuthProfile(userId);
      if (requestId !== profileRequestRef.current) return null;
      setProfile(nextProfile);
      setIsProfileReady(true);
      return nextProfile;
    } catch {
      if (requestId === profileRequestRef.current) {
        setProfile(null);
        setIsProfileReady(true);
      }
      return null;
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(userId: string, requestId: number) {
      setIsProfileReady(false);
      try {
        const nextProfile = await resolveAuthProfile(userId);
        if (cancelled || requestId !== profileRequestRef.current) return;
        setProfile(nextProfile);
        setIsProfileReady(true);
      } catch {
        if (!cancelled && requestId === profileRequestRef.current) {
          setProfile(null);
          setIsProfileReady(true);
        }
      }
    }

    async function applySessionFromStorage() {
      const generation = ++applyGenerationRef.current;
      await applyAuthSessionFromStorage({
        getSession: async () => {
          const supabase = getSupabaseClient();
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();
          return { session: currentSession, error: error ? new Error(error.message) : null };
        },
        isCancelled: () => cancelled || generation !== applyGenerationRef.current,
        nextProfileRequestId: () => ++profileRequestRef.current,
        loadProfile,
        setSession,
        setUser,
        clearProfile: () => {
          profileRequestRef.current += 1;
          setProfile(null);
          setIsProfileReady(true);
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
          setIsProfileReady(true);
        }
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    }

    bootstrapAuth();

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = getSupabaseClient();
      const result = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (signingOutRef.current && event !== 'SIGNED_OUT') {
          return;
        }

        if (event === 'SIGNED_OUT') {
          profileRequestRef.current += 1;
          applyGenerationRef.current += 1;
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsProfileReady(true);
          void clearPasswordRecoveryPending();
          setIsPasswordRecoveryPendingState(false);
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          void markPasswordRecoveryPending();
          setIsPasswordRecoveryPendingState(true);
        }

        // Cold start is handled by bootstrapAuth — a parallel INITIAL_SESSION
        // invalidates the in-flight profile fetch and leaves profile null.
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // Browser tab focus often refreshes the JWT. Updating session tokens is enough —
        // a full profile reload unmounts SetupGate children and resets tabs to Roles.
        if (event === 'TOKEN_REFRESHED') {
          if (nextSession) {
            setSession(nextSession);
            setUser(nextSession.user);
          }
          return;
        }

        // Same-user SIGNED_IN can fire when the tab regains focus / recovers storage.
        // Avoid a full profile cascade if we already have this user loaded.
        if (
          event === 'SIGNED_IN' &&
          nextSession?.user?.id &&
          nextSession.user.id === userIdRef.current &&
          isProfileReadyRef.current
        ) {
          setSession(nextSession);
          setUser(nextSession.user);
          return;
        }

        void applySessionFromStorage();
      });
      subscription = result.data.subscription;
    } catch {
      if (!cancelled) {
        setIsAuthReady(true);
        setIsProfileReady(true);
      }
    }

    return () => {
      cancelled = true;
      profileRequestRef.current += 1;
      applyGenerationRef.current += 1;
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
      setIsProfileReady(true);
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
      isProfileReady,
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
      isProfileReady,
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

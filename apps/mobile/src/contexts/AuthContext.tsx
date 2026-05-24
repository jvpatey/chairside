import {
  getProfile,
  getSupabaseClient,
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

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthReady: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const profileRequestRef = useRef(0);

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
      const nextProfile = await getProfile(userId);
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
        const nextProfile = await getProfile(userId);
        if (cancelled || requestId !== profileRequestRef.current) return;
        setProfile(nextProfile);
      } catch {
        if (!cancelled && requestId === profileRequestRef.current) {
          setProfile(null);
        }
      }
    }

    async function bootstrapAuth() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (cancelled) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          const requestId = ++profileRequestRef.current;
          await loadProfile(data.session.user.id, requestId);
        } else {
          profileRequestRef.current += 1;
          setProfile(null);
        }
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
      const result = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (!nextSession?.user) {
          profileRequestRef.current += 1;
          setProfile(null);
          return;
        }

        const requestId = ++profileRequestRef.current;
        void loadProfile(nextSession.user.id, requestId);
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
    profileRequestRef.current += 1;
    await apiSignOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isAuthReady,
      refreshProfile,
      signOut,
    }),
    [session, user, profile, isAuthReady, refreshProfile, signOut],
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

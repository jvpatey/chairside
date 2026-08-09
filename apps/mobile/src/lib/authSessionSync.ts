import type { Session, User } from '@supabase/supabase-js';

type GetSessionResult = {
  session: Session | null;
  error: Error | null;
};

type ApplyAuthSessionInput = {
  getSession: () => Promise<GetSessionResult>;
  isCancelled: () => boolean;
  nextProfileRequestId: () => number;
  loadProfile: (userId: string, requestId: number) => Promise<void>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  clearProfile: () => void;
};

/**
 * Apply the latest Supabase session from storage.
 *
 * Profile request revisions must never skip setSession: during login,
 * refreshProfile bumps the profile request id while onAuthStateChange is
 * still awaiting getSession. Skipping setSession left AuthContext.session
 * null after a successful sign-in (SetupGate infinite splash).
 *
 * Resolves false when a newer apply superseded this one, so the caller can
 * leave "auth ready" to whichever apply actually settled the session.
 */
export async function applyAuthSessionFromStorage({
  getSession,
  isCancelled,
  nextProfileRequestId,
  loadProfile,
  setSession,
  setUser,
  clearProfile,
}: ApplyAuthSessionInput): Promise<boolean> {
  const { session, error } = await getSession();
  if (error) throw error;
  if (isCancelled()) return false;

  setSession(session);
  setUser(session?.user ?? null);

  if (!session?.user) {
    clearProfile();
    return true;
  }

  const requestId = nextProfileRequestId();
  await loadProfile(session.user.id, requestId);
  return true;
}

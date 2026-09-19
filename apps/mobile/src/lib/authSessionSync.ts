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
  /** Current profile's user id, if any — used to detect account switches. */
  getProfileUserId: () => string | null;
  /** Clear profile after sign-out (marks profile ready). */
  clearProfile: () => void;
  /** Drop stale profile immediately on user-id change (marks profile not ready). */
  invalidateProfileForUserChange: () => void;
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
  getProfileUserId,
  clearProfile,
  invalidateProfileForUserChange,
}: ApplyAuthSessionInput): Promise<boolean> {
  const { session, error } = await getSession();
  if (error) throw error;
  if (isCancelled()) return false;

  const previousProfileUserId = getProfileUserId();

  if (!session?.user) {
    setSession(null);
    setUser(null);
    clearProfile();
    return true;
  }

  // Clear stale profile before swapping user so UI never paints User A under User B.
  if (previousProfileUserId && previousProfileUserId !== session.user.id) {
    invalidateProfileForUserChange();
  }

  setSession(session);
  setUser(session.user);

  const requestId = nextProfileRequestId();
  await loadProfile(session.user.id, requestId);
  return true;
}

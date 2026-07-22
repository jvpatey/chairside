import { describe, expect, it, vi } from 'vitest';

import { applyAuthSessionFromStorage } from './authSessionSync';

describe('applyAuthSessionFromStorage', () => {
  it('applies session even when profile request id changes during getSession (login race)', async () => {
    let profileRequestId = 0;
    const session = {
      user: { id: 'user-1' },
    } as never;

    const setSession = vi.fn();
    const setUser = vi.fn();
    const loadProfile = vi.fn(async () => undefined);
    const clearProfile = vi.fn();

    let resolveGetSession!: (value: {
      session: typeof session;
      error: null;
    }) => void;

    const getSessionPromise = new Promise<{
      session: typeof session;
      error: null;
    }>((resolve) => {
      resolveGetSession = resolve;
    });

    const applyPromise = applyAuthSessionFromStorage({
      getSession: async () => getSessionPromise,
      isCancelled: () => false,
      nextProfileRequestId: () => ++profileRequestId,
      loadProfile,
      setSession,
      setUser,
      clearProfile,
    });

    // Simulate handleAuthSuccess → refreshProfile bumping the profile request id
    // while onAuthStateChange is still awaiting getSession.
    profileRequestId += 1;

    resolveGetSession({ session, error: null });
    await applyPromise;

    expect(setSession).toHaveBeenCalledWith(session);
    expect(setUser).toHaveBeenCalledWith(session.user);
    expect(loadProfile).toHaveBeenCalledWith('user-1', 2);
    expect(clearProfile).not.toHaveBeenCalled();
  });

  it('skips applying session when the provider has unmounted', async () => {
    const setSession = vi.fn();
    const setUser = vi.fn();
    const loadProfile = vi.fn(async () => undefined);

    await applyAuthSessionFromStorage({
      getSession: async () => ({
        session: { user: { id: 'user-1' } } as never,
        error: null,
      }),
      isCancelled: () => true,
      nextProfileRequestId: () => 1,
      loadProfile,
      setSession,
      setUser,
      clearProfile: vi.fn(),
    });

    expect(setSession).not.toHaveBeenCalled();
    expect(loadProfile).not.toHaveBeenCalled();
  });

  it('clears profile when session is null', async () => {
    const clearProfile = vi.fn();
    const loadProfile = vi.fn(async () => undefined);

    await applyAuthSessionFromStorage({
      getSession: async () => ({ session: null, error: null }),
      isCancelled: () => false,
      nextProfileRequestId: () => 1,
      loadProfile,
      setSession: vi.fn(),
      setUser: vi.fn(),
      clearProfile,
    });

    expect(clearProfile).toHaveBeenCalled();
    expect(loadProfile).not.toHaveBeenCalled();
  });
});

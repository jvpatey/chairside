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
    const invalidateProfileForUserChange = vi.fn();

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
      getProfileUserId: () => null,
      clearProfile,
      invalidateProfileForUserChange,
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
    expect(invalidateProfileForUserChange).not.toHaveBeenCalled();
  });

  it('reports applied so the caller can mark auth ready', async () => {
    const applied = await applyAuthSessionFromStorage({
      getSession: async () => ({
        session: { user: { id: 'user-1' } } as never,
        error: null,
      }),
      isCancelled: () => false,
      nextProfileRequestId: () => 1,
      loadProfile: vi.fn(async () => undefined),
      setSession: vi.fn(),
      setUser: vi.fn(),
      getProfileUserId: () => null,
      clearProfile: vi.fn(),
      invalidateProfileForUserChange: vi.fn(),
    });

    expect(applied).toBe(true);
  });

  it('skips applying session when the provider has unmounted', async () => {
    const setSession = vi.fn();
    const setUser = vi.fn();
    const loadProfile = vi.fn(async () => undefined);

    const applied = await applyAuthSessionFromStorage({
      getSession: async () => ({
        session: { user: { id: 'user-1' } } as never,
        error: null,
      }),
      isCancelled: () => true,
      nextProfileRequestId: () => 1,
      loadProfile,
      setSession,
      setUser,
      getProfileUserId: () => null,
      clearProfile: vi.fn(),
      invalidateProfileForUserChange: vi.fn(),
    });

    // Superseded applies must not claim readiness — the winning apply owns it.
    expect(applied).toBe(false);
    expect(setSession).not.toHaveBeenCalled();
    expect(loadProfile).not.toHaveBeenCalled();
  });

  it('clears profile when session is null', async () => {
    const clearProfile = vi.fn();
    const loadProfile = vi.fn(async () => undefined);
    const invalidateProfileForUserChange = vi.fn();

    await applyAuthSessionFromStorage({
      getSession: async () => ({ session: null, error: null }),
      isCancelled: () => false,
      nextProfileRequestId: () => 1,
      loadProfile,
      setSession: vi.fn(),
      setUser: vi.fn(),
      getProfileUserId: () => 'user-1',
      clearProfile,
      invalidateProfileForUserChange,
    });

    expect(clearProfile).toHaveBeenCalled();
    expect(invalidateProfileForUserChange).not.toHaveBeenCalled();
    expect(loadProfile).not.toHaveBeenCalled();
  });

  it('invalidates stale profile before loading when the signed-in user changes', async () => {
    const session = {
      user: { id: 'user-b' },
    } as never;

    const setSession = vi.fn();
    const setUser = vi.fn();
    const loadProfile = vi.fn(async () => undefined);
    const clearProfile = vi.fn();
    const invalidateProfileForUserChange = vi.fn();

    await applyAuthSessionFromStorage({
      getSession: async () => ({ session, error: null }),
      isCancelled: () => false,
      nextProfileRequestId: () => 3,
      loadProfile,
      setSession,
      setUser,
      getProfileUserId: () => 'user-a',
      clearProfile,
      invalidateProfileForUserChange,
    });

    expect(invalidateProfileForUserChange).toHaveBeenCalled();
    expect(clearProfile).not.toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith(session);
    expect(setUser).toHaveBeenCalledWith(session.user);
    expect(loadProfile).toHaveBeenCalledWith('user-b', 3);

    const invalidateOrder = invalidateProfileForUserChange.mock.invocationCallOrder[0];
    const setSessionOrder = setSession.mock.invocationCallOrder[0];
    expect(invalidateOrder).toBeLessThan(setSessionOrder);
  });

  it('does not invalidate profile when the same user reloads', async () => {
    const session = {
      user: { id: 'user-1' },
    } as never;

    const invalidateProfileForUserChange = vi.fn();

    await applyAuthSessionFromStorage({
      getSession: async () => ({ session, error: null }),
      isCancelled: () => false,
      nextProfileRequestId: () => 1,
      loadProfile: vi.fn(async () => undefined),
      setSession: vi.fn(),
      setUser: vi.fn(),
      getProfileUserId: () => 'user-1',
      clearProfile: vi.fn(),
      invalidateProfileForUserChange,
    });

    expect(invalidateProfileForUserChange).not.toHaveBeenCalled();
  });
});

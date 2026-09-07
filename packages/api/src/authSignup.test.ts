import type { Session, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUp = vi.fn();
const signInWithPassword = vi.fn();
const getSession = vi.fn();
const resend = vi.fn();

vi.mock('expo-apple-authentication', () => ({ default: {} }));
vi.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: vi.fn() }));
vi.mock('expo-linking', () => ({ createURL: () => 'chairside://auth/callback' }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    auth: {
      signUp,
      signInWithPassword,
      getSession,
      resend,
    },
  }),
}));

import {
  ACCOUNT_ALREADY_EXISTS_MESSAGE,
  completeEmailSignUp,
  establishSessionAfterSignUp,
  getSignupEmailRedirectUrl,
  hasRealAuthIdentities,
  resendSignupConfirmation,
} from './authSignup';
import { getAuthErrorMessage } from './auth';

function userWithIdentities(id: string): User {
  return {
    id,
    identities: [{ id: 'ident-1', user_id: id, provider: 'email' }],
  } as User;
}

function userWithoutIdentities(id: string): User {
  return {
    id,
    identities: [],
  } as User;
}

function sessionFor(id: string): Session {
  return { user: userWithIdentities(id) } as Session;
}

describe('hasRealAuthIdentities', () => {
  it('is false for missing identities', () => {
    expect(hasRealAuthIdentities(null)).toBe(false);
    expect(hasRealAuthIdentities(userWithoutIdentities('fake'))).toBe(false);
  });

  it('is true when identities are present', () => {
    expect(hasRealAuthIdentities(userWithIdentities('real'))).toBe(true);
  });
});

describe('getSignupEmailRedirectUrl', () => {
  it('uses the production web callback by default', () => {
    const previous = process.env.EXPO_PUBLIC_WEB_BASE_URL;
    delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
    expect(getSignupEmailRedirectUrl()).toBe('https://chairsidedental.app/auth/callback');
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_WEB_BASE_URL = previous;
    }
  });
});

describe('establishSessionAfterSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: null } });
  });

  it('uses the signup session when identities are real', async () => {
    const session = sessionFor('real-user');
    const result = await establishSessionAfterSignUp('a@b.com', 'password1', {
      session,
      user: session.user,
    });

    expect(result).toEqual({
      session,
      user: session.user,
      confirmationRequired: false,
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('ignores a stored session for a different user', async () => {
    getSession.mockResolvedValue({ data: { session: sessionFor('other-user') } });
    signInWithPassword.mockResolvedValue({
      data: { session: sessionFor('real-user') },
      error: null,
    });

    const result = await establishSessionAfterSignUp('a@b.com', 'password1', {
      session: null,
      user: userWithIdentities('real-user'),
    });

    expect(result.user?.id).toBe('real-user');
    expect(result.confirmationRequired).toBe(false);
    expect(signInWithPassword).toHaveBeenCalled();
  });

  it('signs in when signup returned empty identities and never uses the fake id', async () => {
    const realSession = sessionFor('real-user');
    signInWithPassword.mockResolvedValue({ data: { session: realSession }, error: null });

    const result = await establishSessionAfterSignUp('a@b.com', 'password1', {
      session: null,
      user: userWithoutIdentities('fake-user'),
    });

    expect(result.user?.id).toBe('real-user');
    expect(result.user?.id).not.toBe('fake-user');
    expect(result.confirmationRequired).toBe(false);
  });

  it('returns confirmationRequired when sign-in says email is not confirmed', async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Email not confirmed' },
    });

    const result = await establishSessionAfterSignUp('a@b.com', 'password1', {
      session: null,
      user: userWithIdentities('real-user'),
    });

    expect(result).toEqual({
      session: null,
      user: null,
      confirmationRequired: true,
    });
  });

  it('maps invalid password on a duplicate/obfuscated signup to already registered', async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      establishSessionAfterSignUp('a@b.com', 'wrong-password', {
        session: null,
        user: userWithoutIdentities('fake-user'),
      }),
    ).rejects.toThrow(ACCOUNT_ALREADY_EXISTS_MESSAGE);
  });
});

describe('completeEmailSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: null } });
  });

  it('treats already-registered as a sign-in attempt', async () => {
    signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    });
    signInWithPassword.mockResolvedValue({
      data: { session: sessionFor('real-user') },
      error: null,
    });

    const result = await completeEmailSignUp('a@b.com', 'password1', 'worker');

    expect(result.user?.id).toBe('real-user');
    expect(result.confirmationRequired).toBe(false);
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: 'https://chairsidedental.app/auth/callback',
        }),
      }),
    );
  });
});

describe('resendSignupConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resends through Auth with the https callback', async () => {
    resend.mockResolvedValue({ error: null });
    await resendSignupConfirmation('  a@b.com  ');
    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.com',
      options: { emailRedirectTo: 'https://chairsidedental.app/auth/callback' },
    });
  });
});

describe('getAuthErrorMessage', () => {
  it('maps profiles RLS failures to a sign-in hint', () => {
    expect(
      getAuthErrorMessage(new Error("new row violates row-level security policy for table 'profiles'")),
    ).toBe(
      'Could not finish creating your account. If you already signed up, check your email or try Sign in.',
    );
  });

  it('keeps the confirm-email sign-in message', () => {
    expect(getAuthErrorMessage(new Error('Email not confirmed'))).toBe(
      'Please confirm your email before signing in.',
    );
  });
});

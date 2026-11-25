import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
const updateUser = vi.fn();
const getSession = vi.fn();
const getUser = vi.fn();
const getUserIdentities = vi.fn();
const unlinkIdentity = vi.fn();
const refreshSession = vi.fn();
const resend = vi.fn();
const rpc = vi.fn();
const functionsInvoke = vi.fn();
const updateProfileNameMock = vi.fn();
const setProfileRoleMock = vi.fn();
const ensureWorkerProfileRowMock = vi.fn();
const upsertWorkerProfileMock = vi.fn();

vi.mock('@chairside/config', () => ({
  normalizePhoneToE164: (input: string | null | undefined) => {
    if (!input?.trim()) return null;
    const digits = input.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  },
}));

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithOtp,
      verifyOtp,
      updateUser,
      getSession,
      getUser,
      getUserIdentities,
      unlinkIdentity,
      refreshSession,
      resend,
    },
    rpc,
    functions: {
      invoke: (...args: unknown[]) => functionsInvoke(...args),
    },
  }),
}));

vi.mock('./authSignup', () => ({
  getSignupEmailRedirectUrl: () => 'https://chairsidedental.app/auth/callback',
}));

vi.mock('./profile', () => ({
  updateProfileName: (...args: unknown[]) => updateProfileNameMock(...args),
  setProfileRole: (...args: unknown[]) => setProfileRoleMock(...args),
}));

vi.mock('./workerProfile', () => ({
  ensureWorkerProfileRow: (...args: unknown[]) => ensureWorkerProfileRowMock(...args),
  upsertWorkerProfile: (...args: unknown[]) => upsertWorkerProfileMock(...args),
}));

import {
  authPhoneToStorageDigits,
  authUserHasPhone,
  authUserHasVerifiedPhone,
  clearAuthPhoneBind,
  finishWorkerOtpAuth,
  normalizeAuthPhone,
  requestAuthPhoneBind,
  signInWithEmailOtp,
  signInWithPhoneOtp,
  verifyAuthPhoneBind,
  verifyEmailOtp,
  verifyPhoneOtp,
} from './authOtp';

describe('normalizeAuthPhone', () => {
  it('normalizes NANP to E.164', () => {
    expect(normalizeAuthPhone('(902) 555-0100')).toBe('+19025550100');
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizeAuthPhone('123')).toThrow(/valid 10-digit/i);
  });
});

describe('authPhoneToStorageDigits', () => {
  it('strips country code for storage', () => {
    expect(authPhoneToStorageDigits('+19025550100')).toBe('9025550100');
  });
});

describe('email OTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends an email OTP with role metadata', async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    await signInWithEmailOtp('worker@example.com', 'worker');
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'worker@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'https://chairsidedental.app/auth/callback',
        data: { role: 'worker' },
      },
    });
  });

  it('verifies an email OTP', async () => {
    const session = { user: { id: 'u1' } };
    verifyOtp.mockResolvedValue({ data: { session }, error: null });
    await expect(verifyEmailOtp('worker@example.com', '123456')).resolves.toBe(session);
    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'worker@example.com',
      token: '123456',
      type: 'email',
    });
  });

  it('falls back to signup OTP type for confirm-email codes', async () => {
    const session = { user: { id: 'u1' } };
    verifyOtp
      .mockResolvedValueOnce({ data: { session: null }, error: { message: 'Token invalid' } })
      .mockResolvedValueOnce({ data: { session }, error: null });
    await expect(verifyEmailOtp('worker@example.com', '654321')).resolves.toBe(session);
    expect(verifyOtp).toHaveBeenNthCalledWith(2, {
      email: 'worker@example.com',
      token: '654321',
      type: 'signup',
    });
  });
});

describe('phone OTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a phone OTP', async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    await expect(signInWithPhoneOtp('9025550100', 'worker')).resolves.toBe('+19025550100');
    expect(signInWithOtp).toHaveBeenCalledWith({
      phone: '+19025550100',
      options: {
        shouldCreateUser: true,
        data: { role: 'worker' },
      },
    });
  });

  it('can refuse to create users on sign-in', async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    await signInWithPhoneOtp('9025550100', undefined, { createUser: false });
    expect(signInWithOtp).toHaveBeenCalledWith({
      phone: '+19025550100',
      options: {
        shouldCreateUser: false,
        data: undefined,
      },
    });
  });

  it('verifies a phone OTP', async () => {
    const session = { user: { id: 'u1' } };
    verifyOtp.mockResolvedValue({ data: { session }, error: null });
    await expect(verifyPhoneOtp('+19025550100', '654321')).resolves.toBe(session);
  });

  it('requests an auth phone bind while signed in and resends phone_change', async () => {
    getUser
      .mockResolvedValueOnce({ data: { user: { phone: null, phone_confirmed_at: null } } })
      .mockResolvedValueOnce({
        data: { user: { phone: '+19025550100', phone_confirmed_at: null } },
      });
    updateUser.mockResolvedValue({ data: { user: {} }, error: null });
    resend.mockResolvedValue({ data: {}, error: null });
    await expect(requestAuthPhoneBind('9025550100')).resolves.toEqual({
      e164: '+19025550100',
      needsOtp: true,
    });
    expect(updateUser).toHaveBeenCalledWith({ phone: '+19025550100' });
    expect(resend).toHaveBeenCalledWith({ type: 'phone_change', phone: '+19025550100' });
  });

  it('clears auth phone via unlink when a phone identity exists', async () => {
    getUserIdentities.mockResolvedValue({
      data: {
        identities: [
          { id: 'email-1', provider: 'email' },
          { id: 'phone-1', provider: 'phone' },
        ],
      },
      error: null,
    });
    unlinkIdentity.mockResolvedValue({ data: {}, error: null });
    rpc.mockResolvedValue({ data: null, error: null });
    refreshSession.mockResolvedValue({ data: {}, error: null });
    await clearAuthPhoneBind('u1');
    expect(unlinkIdentity).toHaveBeenCalledWith({ id: 'phone-1', provider: 'phone' });
    expect(rpc).toHaveBeenCalledWith('clear_own_auth_phone');
    expect(upsertWorkerProfileMock).toHaveBeenCalledWith('u1', {
      phone: null,
      fill_in_sms_opt_in: false,
    });
  });

  it('clears auth phone via RPC when no phone identity is linked', async () => {
    getUserIdentities.mockResolvedValue({
      data: { identities: [{ id: 'email-1', provider: 'email' }] },
      error: null,
    });
    rpc.mockResolvedValue({ data: null, error: null });
    refreshSession.mockResolvedValue({ data: {}, error: null });
    await clearAuthPhoneBind('u1');
    expect(unlinkIdentity).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('clear_own_auth_phone');
    expect(upsertWorkerProfileMock).toHaveBeenCalledWith('u1', {
      phone: null,
      fill_in_sms_opt_in: false,
    });
  });

  it('rejects auto-confirmed phone when confirmations are off', async () => {
    getUser
      .mockResolvedValueOnce({ data: { user: { phone: null, phone_confirmed_at: null } } })
      .mockResolvedValueOnce({
        data: {
          user: { phone: '+19025550100', phone_confirmed_at: '2026-01-01T00:00:00Z' },
        },
      });
    updateUser.mockResolvedValue({ data: { user: {} }, error: null });
    await expect(requestAuthPhoneBind('9025550100')).rejects.toThrow(/without an SMS code/i);
    expect(resend).not.toHaveBeenCalled();
  });

  it('reclaims a shell then retries bind when the phone is taken', async () => {
    getUser
      .mockResolvedValueOnce({ data: { user: { phone: null, phone_confirmed_at: null } } })
      .mockResolvedValueOnce({
        data: { user: { phone: '+19025550100', phone_confirmed_at: null } },
      });
    updateUser
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Phone number already registered' },
      })
      .mockResolvedValueOnce({ data: { user: {} }, error: null });
    resend.mockResolvedValue({ data: {}, error: null });
    functionsInvoke.mockResolvedValue({ data: { status: 'reclaimed' }, error: null });
    await expect(requestAuthPhoneBind('9025550100')).resolves.toEqual({
      e164: '+19025550100',
      needsOtp: true,
    });
    expect(functionsInvoke).toHaveBeenCalledWith('reclaim-auth-phone', {
      body: { phone: '+19025550100', action: 'reclaim' },
    });
    expect(updateUser).toHaveBeenCalledTimes(2);
  });

  it('verifies phone_change and writes worker profile phone', async () => {
    verifyOtp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    await expect(verifyAuthPhoneBind('u1', '9025550100', '123456')).resolves.toBe('+19025550100');
    expect(verifyOtp).toHaveBeenCalledWith({
      phone: '+19025550100',
      token: '123456',
      type: 'phone_change',
    });
    expect(upsertWorkerProfileMock).toHaveBeenCalledWith('u1', { phone: '9025550100' });
  });
});

describe('authUserHasPhone', () => {
  it('matches auth E.164 to storage digits', () => {
    expect(authUserHasPhone('+19025550100', '9025550100')).toBe(true);
    expect(authUserHasPhone('+19025550999', '9025550100')).toBe(false);
    expect(authUserHasPhone(null, '9025550100')).toBe(false);
  });

  it('requires phone_confirmed_at for verified matches', () => {
    expect(
      authUserHasVerifiedPhone(
        { phone: '+19025550100', phone_confirmed_at: '2026-01-01T00:00:00Z' },
        '9025550100',
      ),
    ).toBe(true);
    expect(
      authUserHasVerifiedPhone({ phone: '+19025550100', phone_confirmed_at: null }, '9025550100'),
    ).toBe(false);
  });
});

describe('finishWorkerOtpAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileNameMock.mockResolvedValue({});
    setProfileRoleMock.mockResolvedValue({});
    ensureWorkerProfileRowMock.mockResolvedValue({});
    upsertWorkerProfileMock.mockResolvedValue({});
  });

  it('writes name, role, and verified phone for workers', async () => {
    await finishWorkerOtpAuth({
      userId: 'u1',
      role: 'worker',
      name: { firstName: 'Ada', lastName: 'Lovelace' },
      phoneE164: '+19025550100',
    });

    expect(updateProfileNameMock).toHaveBeenCalledWith('u1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(setProfileRoleMock).toHaveBeenCalledWith('u1', 'worker');
    expect(ensureWorkerProfileRowMock).toHaveBeenCalledWith('u1');
    expect(upsertWorkerProfileMock).toHaveBeenCalledWith('u1', { phone: '9025550100' });
  });
});

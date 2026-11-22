import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
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
  finishWorkerOtpAuth,
  normalizeAuthPhone,
  signInWithEmailOtp,
  signInWithPhoneOtp,
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

  it('verifies a phone OTP', async () => {
    const session = { user: { id: 'u1' } };
    verifyOtp.mockResolvedValue({ data: { session }, error: null });
    await expect(verifyPhoneOtp('+19025550100', '654321')).resolves.toBe(session);
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

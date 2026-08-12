import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const refreshSession = vi.fn();
const invoke = vi.fn();

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    auth: { getUser, refreshSession },
    functions: { invoke },
    rpc: vi.fn(),
  }),
}));

import {
  CLINIC_BILLING_SESSION_EXPIRED_MESSAGE,
  ensureClinicBillingSession,
  isClinicBillingSessionExpiredError,
  syncClinicSubscriptionFromRevenueCat,
} from './billing';

describe('isClinicBillingSessionExpiredError', () => {
  it('matches 401 status on FunctionsHttpError-shaped objects', () => {
    expect(
      isClinicBillingSessionExpiredError({
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 401 },
      }),
    ).toBe(true);
  });

  it('matches expired-session and missing-authorization copy', () => {
    expect(isClinicBillingSessionExpiredError(new Error('Invalid or expired session'))).toBe(true);
    expect(isClinicBillingSessionExpiredError(new Error('Missing authorization'))).toBe(true);
    expect(isClinicBillingSessionExpiredError('jwt expired')).toBe(true);
    expect(isClinicBillingSessionExpiredError(CLINIC_BILLING_SESSION_EXPIRED_MESSAGE)).toBe(true);
  });

  it('ignores unrelated sync failures', () => {
    expect(
      isClinicBillingSessionExpiredError(new Error('Edge Function returned a non-2xx status code')),
    ).toBe(false);
    expect(isClinicBillingSessionExpiredError(new Error('RevenueCat request failed'))).toBe(false);
    expect(
      isClinicBillingSessionExpiredError({
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 500 },
      }),
    ).toBe(false);
  });
});

describe('ensureClinicBillingSession', () => {
  beforeEach(() => {
    getUser.mockReset();
    refreshSession.mockReset();
  });

  it('returns when getUser has a valid user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(ensureClinicBillingSession()).resolves.toBeUndefined();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes when getUser fails and refresh succeeds', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });
    refreshSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    await expect(ensureClinicBillingSession()).resolves.toBeUndefined();
  });

  it('throws sign-in copy when refresh also fails', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'refresh failed' },
    });
    await expect(ensureClinicBillingSession()).rejects.toThrow(
      CLINIC_BILLING_SESSION_EXPIRED_MESSAGE,
    );
  });
});

describe('syncClinicSubscriptionFromRevenueCat', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('maps expired JWT body to sign-in copy', async () => {
    invoke.mockResolvedValue({
      data: { error: 'Invalid or expired session' },
      error: { message: 'Edge Function returned a non-2xx status code', context: { status: 401 } },
    });
    await expect(syncClinicSubscriptionFromRevenueCat()).rejects.toThrow(
      CLINIC_BILLING_SESSION_EXPIRED_MESSAGE,
    );
  });

  it('maps missing authorization header to sign-in copy', async () => {
    invoke.mockResolvedValue({
      data: { error: 'Missing authorization header' },
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    await expect(syncClinicSubscriptionFromRevenueCat()).rejects.toThrow(
      CLINIC_BILLING_SESSION_EXPIRED_MESSAGE,
    );
  });

  it('maps 401 status without body to sign-in copy', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 401 },
      },
    });
    await expect(syncClinicSubscriptionFromRevenueCat()).rejects.toThrow(
      CLINIC_BILLING_SESSION_EXPIRED_MESSAGE,
    );
  });

  it('keeps unrelated function errors', async () => {
    invoke.mockResolvedValue({
      data: { error: 'RevenueCat request failed' },
      error: { message: 'Edge Function returned a non-2xx status code', context: { status: 500 } },
    });
    await expect(syncClinicSubscriptionFromRevenueCat()).rejects.toThrow(
      'RevenueCat request failed',
    );
  });

  it('returns plan on success', async () => {
    invoke.mockResolvedValue({
      data: { plan: 'starter', status: 'active' },
      error: null,
    });
    await expect(syncClinicSubscriptionFromRevenueCat()).resolves.toEqual({
      plan: 'starter',
      status: 'active',
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  authUserHasVerifiedPhone: (
    user: { phone?: string | null; phone_confirmed_at?: string | null } | null,
    storage: string,
  ) => Boolean(user?.phone_confirmed_at) && user?.phone === `+1${storage}`,
}));

import { getClinicTextAlertsSubtitle, isClinicTextPhoneVerified } from './clinicTextAlerts';

describe('isClinicTextPhoneVerified', () => {
  const verifiedUser = { phone: '+19025550100', phone_confirmed_at: '2026-11-01T00:00:00Z' };

  it('is false when no phone is stored', () => {
    expect(isClinicTextPhoneVerified(verifiedUser, null)).toBe(false);
    expect(isClinicTextPhoneVerified(verifiedUser, '  ')).toBe(false);
  });

  it('matches a formatted stored phone against the verified Auth phone', () => {
    expect(isClinicTextPhoneVerified(verifiedUser, '(902) 555-0100')).toBe(true);
  });

  it('is false when Auth has no confirmed phone', () => {
    expect(
      isClinicTextPhoneVerified({ phone: '+19025550100', phone_confirmed_at: null }, '9025550100'),
    ).toBe(false);
  });
});

describe('getClinicTextAlertsSubtitle', () => {
  it('asks for a number when none is saved', () => {
    expect(getClinicTextAlertsSubtitle({ storedPhone: null, verified: false })).toBe(
      'Add a number for cover-request texts',
    );
  });

  it('asks to verify an unverified number', () => {
    expect(getClinicTextAlertsSubtitle({ storedPhone: '9025550100', verified: false })).toBe(
      'Verify your number to get texts',
    );
  });

  it('shows the formatted number once verified', () => {
    expect(getClinicTextAlertsSubtitle({ storedPhone: '9025550100', verified: true })).toBe(
      'Verified · (902) 555-0100',
    );
  });
});

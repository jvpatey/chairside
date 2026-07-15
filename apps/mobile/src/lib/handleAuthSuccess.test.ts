import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveAuthProfile: vi.fn(),
  routerReplace: vi.fn(),
  isPasswordRecoveryPending: vi.fn(),
  readClinicInviteToken: vi.fn(),
  buildClinicInviteAcceptHref: vi.fn((token: string) => `/accept-invite?token=${token}`),
  resolveAuthenticatedRoute: vi.fn(),
}));

vi.mock('@chairside/api', () => ({
  resolveAuthProfile: mocks.resolveAuthProfile,
}));

vi.mock('expo-router', () => ({
  router: { replace: mocks.routerReplace },
}));

vi.mock('@/lib/authRecoveryState', () => ({
  isPasswordRecoveryPending: mocks.isPasswordRecoveryPending,
}));

vi.mock('@/lib/clinicInviteSession', () => ({
  readClinicInviteToken: mocks.readClinicInviteToken,
  buildClinicInviteAcceptHref: mocks.buildClinicInviteAcceptHref,
}));

vi.mock('@/lib/resolveAuthenticatedRoute', () => ({
  resolveAuthenticatedRoute: mocks.resolveAuthenticatedRoute,
}));

import { handleAuthSuccess } from './handleAuthSuccess';

describe('handleAuthSuccess invite resume', () => {
  const refreshProfile = vi.fn(async () => ({ role: 'clinic' as const }));
  const completeOnboarding = vi.fn(async () => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPasswordRecoveryPending.mockResolvedValue(false);
    mocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: 'clinic' });
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(clinic-tabs)',
      role: 'clinic',
    });
  });

  it('returns to accept-invite when a token is stored', async () => {
    mocks.readClinicInviteToken.mockResolvedValue('invite-token');

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.routerReplace).toHaveBeenCalledWith('/accept-invite?token=invite-token');
    expect(mocks.resolveAuthenticatedRoute).not.toHaveBeenCalled();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('uses normal routing when no invite token is stored', async () => {
    mocks.readClinicInviteToken.mockResolvedValue(null);

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.resolveAuthenticatedRoute).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledWith('clinic');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(clinic-tabs)');
  });
});

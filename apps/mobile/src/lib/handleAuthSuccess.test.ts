import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveAuthProfile: vi.fn(),
  setProfileRole: vi.fn(),
  previewClinicManagerInvitation: vi.fn(),
  routerReplace: vi.fn(),
  isPasswordRecoveryPending: vi.fn(),
  readClinicInviteToken: vi.fn(),
  clearClinicInviteToken: vi.fn(),
  buildClinicInviteAcceptHref: vi.fn((token: string) => `/accept-invite?token=${token}`),
  resolveAuthenticatedRoute: vi.fn(),
  consumePendingSignupRole: vi.fn(),
  clearPendingSignupRole: vi.fn(),
}));

vi.mock('@chairside/api', () => ({
  resolveAuthProfile: mocks.resolveAuthProfile,
  setProfileRole: mocks.setProfileRole,
  previewClinicManagerInvitation: mocks.previewClinicManagerInvitation,
}));

vi.mock('expo-router', () => ({
  router: { replace: mocks.routerReplace },
}));

vi.mock('@/lib/authRecoveryState', () => ({
  isPasswordRecoveryPending: mocks.isPasswordRecoveryPending,
}));

vi.mock('@/lib/clinicInviteSession', () => ({
  readClinicInviteToken: mocks.readClinicInviteToken,
  clearClinicInviteToken: mocks.clearClinicInviteToken,
  buildClinicInviteAcceptHref: mocks.buildClinicInviteAcceptHref,
}));

vi.mock('@/lib/pendingSignupRole', () => ({
  consumePendingSignupRole: mocks.consumePendingSignupRole,
  clearPendingSignupRole: mocks.clearPendingSignupRole,
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
    mocks.consumePendingSignupRole.mockResolvedValue(null);
    mocks.clearPendingSignupRole.mockResolvedValue(undefined);
    mocks.clearClinicInviteToken.mockResolvedValue(undefined);
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(clinic-tabs)',
      role: 'clinic',
    });
  });

  it('returns to accept-invite when a pending invite token is stored', async () => {
    mocks.readClinicInviteToken.mockResolvedValue('invite-token');
    mocks.previewClinicManagerInvitation.mockResolvedValue({ status: 'pending' });

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.previewClinicManagerInvitation).toHaveBeenCalledWith('invite-token');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/accept-invite?token=invite-token');
    expect(mocks.clearClinicInviteToken).not.toHaveBeenCalled();
    expect(mocks.resolveAuthenticatedRoute).not.toHaveBeenCalled();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('clears stale invite tokens and uses normal routing', async () => {
    mocks.readClinicInviteToken.mockResolvedValue('stale-token');
    mocks.previewClinicManagerInvitation.mockResolvedValue({ status: 'revoked' });

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.clearClinicInviteToken).toHaveBeenCalled();
    expect(mocks.resolveAuthenticatedRoute).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledWith('clinic');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(clinic-tabs)');
  });

  it('keeps the invite flow when preview fails transiently', async () => {
    mocks.readClinicInviteToken.mockResolvedValue('invite-token');
    mocks.previewClinicManagerInvitation.mockRejectedValue(new Error('network'));

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.clearClinicInviteToken).not.toHaveBeenCalled();
    expect(mocks.routerReplace).toHaveBeenCalledWith('/accept-invite?token=invite-token');
    expect(mocks.resolveAuthenticatedRoute).not.toHaveBeenCalled();
  });

  it('uses normal routing when no invite token is stored', async () => {
    mocks.readClinicInviteToken.mockResolvedValue(null);

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.previewClinicManagerInvitation).not.toHaveBeenCalled();
    expect(mocks.clearPendingSignupRole).toHaveBeenCalled();
    expect(mocks.resolveAuthenticatedRoute).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledWith('clinic');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(clinic-tabs)');
  });

  it('applies a pending signup role when the profile has none', async () => {
    mocks.readClinicInviteToken.mockResolvedValue(null);
    mocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: null });
    mocks.consumePendingSignupRole.mockResolvedValue('worker');
    mocks.setProfileRole.mockResolvedValue({ id: 'user-1', role: 'worker' });
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(worker-setup)/basics',
      role: 'worker',
    });
    refreshProfile.mockResolvedValue({ role: 'worker' });

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.setProfileRole).toHaveBeenCalledWith('user-1', 'worker');
    expect(completeOnboarding).toHaveBeenCalledWith('worker');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(worker-setup)/basics');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveAuthProfile: vi.fn(),
  setProfileRole: vi.fn(),
  routerReplace: vi.fn(),
  isPasswordRecoveryPending: vi.fn(),
  resolveAuthenticatedRoute: vi.fn(),
  consumePendingSignupRole: vi.fn(),
  clearPendingSignupRole: vi.fn(),
  consumePendingPublicListingHref: vi.fn(),
  clearPendingPublicListingHref: vi.fn(),
  captureAnalyticsEvent: vi.fn(),
  getNextWorkerPostAuthCaptureStep: vi.fn(),
  getWorkerPostAuthCaptureHref: vi.fn((step: string) => `/(onboarding)/capture-${step}`),
  getNextClinicPostAuthCaptureStep: vi.fn(),
  getClinicPostAuthCaptureHref: vi.fn((step: string) => `/(onboarding)/capture-clinic-${step}`),
}));

vi.mock('@chairside/api', () => ({
  resolveAuthProfile: mocks.resolveAuthProfile,
  setProfileRole: mocks.setProfileRole,
}));

vi.mock('expo-router', () => ({
  router: { replace: mocks.routerReplace },
}));

vi.mock('@/lib/authRecoveryState', () => ({
  isPasswordRecoveryPending: mocks.isPasswordRecoveryPending,
}));

vi.mock('@/lib/pendingSignupRole', () => ({
  consumePendingSignupRole: mocks.consumePendingSignupRole,
  clearPendingSignupRole: mocks.clearPendingSignupRole,
}));

vi.mock('@/lib/pendingPublicListing', () => ({
  consumePendingPublicListingHref: mocks.consumePendingPublicListingHref,
  clearPendingPublicListingHref: mocks.clearPendingPublicListingHref,
}));

vi.mock('@/lib/analytics/posthog', () => ({
  captureAnalyticsEvent: mocks.captureAnalyticsEvent,
}));

vi.mock('@/lib/resolveAuthenticatedRoute', () => ({
  resolveAuthenticatedRoute: mocks.resolveAuthenticatedRoute,
}));

vi.mock('@/lib/workerPostAuthCapture', () => ({
  getNextWorkerPostAuthCaptureStep: mocks.getNextWorkerPostAuthCaptureStep,
  getWorkerPostAuthCaptureHref: mocks.getWorkerPostAuthCaptureHref,
}));

vi.mock('@/lib/clinicPostAuthCapture', () => ({
  getNextClinicPostAuthCaptureStep: mocks.getNextClinicPostAuthCaptureStep,
  getClinicPostAuthCaptureHref: mocks.getClinicPostAuthCaptureHref,
}));

import { handleAuthSuccess } from './handleAuthSuccess';

describe('handleAuthSuccess', () => {
  const refreshProfile = vi.fn(async () => ({ role: 'clinic' as const }));
  const completeOnboarding = vi.fn(async () => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPasswordRecoveryPending.mockResolvedValue(false);
    mocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: 'clinic' });
    mocks.consumePendingSignupRole.mockResolvedValue(null);
    mocks.clearPendingSignupRole.mockResolvedValue(undefined);
    mocks.consumePendingPublicListingHref.mockResolvedValue(null);
    mocks.clearPendingPublicListingHref.mockResolvedValue(undefined);
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(clinic-tabs)',
      role: 'clinic',
    });
    mocks.getNextWorkerPostAuthCaptureStep.mockResolvedValue(null);
    mocks.getNextClinicPostAuthCaptureStep.mockResolvedValue(null);
  });

  it('routes clinics into the next post-auth capture step', async () => {
    mocks.getNextClinicPostAuthCaptureStep.mockResolvedValue('clinic-name');

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.routerReplace).toHaveBeenCalledWith('/(onboarding)/capture-clinic-clinic-name');
  });

  it('routes workers into the next post-auth capture step', async () => {
    mocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: 'worker' });
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(tabs)',
      role: 'worker',
    });
    refreshProfile.mockResolvedValue({ role: 'worker' });
    mocks.getNextWorkerPostAuthCaptureStep.mockResolvedValue('phone');

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.getWorkerPostAuthCaptureHref).toHaveBeenCalledWith('phone');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(onboarding)/capture-phone');
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('uses normal routing for signed-in clinics', async () => {
    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.clearPendingSignupRole).toHaveBeenCalled();
    expect(refreshProfile).toHaveBeenCalledWith('user-1');
    expect(mocks.resolveAuthenticatedRoute).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledWith('clinic');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(clinic-tabs)');
  });

  it('applies a pending signup role when the profile has none', async () => {
    mocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: null });
    mocks.consumePendingSignupRole.mockResolvedValue('worker');
    mocks.setProfileRole.mockResolvedValue({ id: 'user-1', role: 'worker' });
    mocks.resolveAuthenticatedRoute.mockResolvedValue({
      href: '/(tabs)',
      role: 'worker',
    });
    refreshProfile.mockResolvedValue({ role: 'worker' });

    await handleAuthSuccess(refreshProfile, completeOnboarding, 'user-1');

    expect(mocks.setProfileRole).toHaveBeenCalledWith('user-1', 'worker');
    expect(refreshProfile).toHaveBeenCalledWith('user-1');
    expect(completeOnboarding).toHaveBeenCalledWith('worker');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(tabs)');
  });
});

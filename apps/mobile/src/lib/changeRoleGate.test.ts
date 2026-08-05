import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/setupCompletion', () => ({
  isClinicSetupComplete: (
    profile: { setup_completed_at?: string | null; clinic_name?: string | null } | null,
  ) => Boolean(profile?.setup_completed_at) || Boolean(profile?.clinic_name?.trim()),
  isWorkerSetupComplete: (
    profile: { setup_completed_at?: string | null; role_types?: string[] | null } | null,
  ) => Boolean(profile?.setup_completed_at) || (profile?.role_types?.length ?? 0) > 0,
}));

import { getChangeRoleGateDecision } from './changeRoleGate';

describe('getChangeRoleGateDecision', () => {
  it('allows when profile has no role yet', () => {
    expect(
      getChangeRoleGateDecision({
        profile: null,
        workerProfile: null,
        clinicProfile: null,
        isWorkerProfileReady: true,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'allow' });
  });

  it('allows incomplete worker setup so they can switch paths', () => {
    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'worker' } as never,
        workerProfile: null,
        clinicProfile: null,
        isWorkerProfileReady: true,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'allow' });
  });

  it('allows incomplete clinic setup so they can switch paths', () => {
    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'clinic' } as never,
        workerProfile: null,
        clinicProfile: { id: 'u1', account_type: 'individual' } as never,
        isWorkerProfileReady: true,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'allow' });
  });

  it('waits while the current role profile is still loading', () => {
    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'worker' } as never,
        workerProfile: null,
        clinicProfile: null,
        isWorkerProfileReady: false,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'loading' });

    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'clinic' } as never,
        workerProfile: null,
        clinicProfile: null,
        isWorkerProfileReady: true,
        isClinicProfileReady: false,
      }),
    ).toEqual({ type: 'loading' });
  });

  it('redirects workers with completed setup away from the role screen', () => {
    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'worker' } as never,
        workerProfile: { id: 'u1', setup_completed_at: '2026-01-01T00:00:00.000Z' } as never,
        clinicProfile: null,
        isWorkerProfileReady: true,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'redirect', href: '/(tabs)' });
  });

  it('redirects clinics with completed setup away from the role screen', () => {
    expect(
      getChangeRoleGateDecision({
        profile: { id: 'u1', role: 'clinic' } as never,
        workerProfile: null,
        clinicProfile: {
          id: 'u1',
          setup_completed_at: '2026-01-01T00:00:00.000Z',
        } as never,
        isWorkerProfileReady: true,
        isClinicProfileReady: true,
      }),
    ).toEqual({ type: 'redirect', href: '/(clinic-tabs)' });
  });
});

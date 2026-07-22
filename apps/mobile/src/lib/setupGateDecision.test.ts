import { describe, expect, it } from 'vitest';

import {
  getClinicSetupGateDecision,
  getWorkerSetupGateDecision,
} from './setupGateDecision';

const clinicProfile = {
  id: 'clinic-1',
  account_type: 'individual' as const,
  setup_completed_at: '2026-01-01T00:00:00.000Z',
};

describe('getClinicSetupGateDecision', () => {
  it('redirects to welcome when auth is ready but session is missing', () => {
    expect(
      getClinicSetupGateDecision({
        isAuthReady: true,
        session: null,
        profile: { id: 'u1', role: 'clinic' } as never,
        isClinicProfileReady: true,
        clinicProfile: clinicProfile as never,
        membership: null,
        isOwner: true,
        isClinicGroupsEnabled: false,
        isClinicSetupComplete: () => true,
      }),
    ).toEqual({ type: 'redirect', href: '/(onboarding)/welcome' });
  });

  it('redirects to role selection when profile is null', () => {
    expect(
      getClinicSetupGateDecision({
        isAuthReady: true,
        session: {},
        profile: null,
        isClinicProfileReady: true,
        clinicProfile: null,
        membership: null,
        isOwner: true,
        isClinicGroupsEnabled: false,
        isClinicSetupComplete: () => false,
      }),
    ).toEqual({ type: 'redirect', href: '/(onboarding)/role?fromAuth=1' });
  });

  it('redirects workers away from clinic tabs', () => {
    expect(
      getClinicSetupGateDecision({
        isAuthReady: true,
        session: {},
        profile: { id: 'u1', role: 'worker' } as never,
        isClinicProfileReady: true,
        clinicProfile: null,
        membership: null,
        isOwner: true,
        isClinicGroupsEnabled: false,
        isClinicSetupComplete: () => false,
      }),
    ).toEqual({ type: 'redirect', href: '/(tabs)' });
  });
});

describe('getWorkerSetupGateDecision', () => {
  it('redirects to setup when worker profile is null after ready', () => {
    expect(
      getWorkerSetupGateDecision({
        isAuthReady: true,
        session: {},
        profile: { id: 'u1', role: 'worker' } as never,
        isWorkerProfileReady: true,
        workerProfile: null,
        isWorkerSetupComplete: () => false,
      }),
    ).toEqual({ type: 'redirect', href: '/(worker-setup)/basics' });
  });

  it('redirects clinic users away from worker tabs', () => {
    expect(
      getWorkerSetupGateDecision({
        isAuthReady: true,
        session: {},
        profile: { id: 'u1', role: 'clinic' } as never,
        isWorkerProfileReady: true,
        workerProfile: null,
        isWorkerSetupComplete: () => false,
      }),
    ).toEqual({ type: 'redirect', href: '/(clinic-tabs)' });
  });

  it('shows children when worker setup is complete', () => {
    expect(
      getWorkerSetupGateDecision({
        isAuthReady: true,
        session: {},
        profile: { id: 'u1', role: 'worker' } as never,
        isWorkerProfileReady: true,
        workerProfile: { setup_completed_at: '2026-01-01T00:00:00.000Z' },
        isWorkerSetupComplete: () => true,
      }),
    ).toEqual({ type: 'children' });
  });
});

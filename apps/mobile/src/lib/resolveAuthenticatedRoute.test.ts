import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  getClinicProfile: vi.fn(),
  getWorkerProfile: vi.fn(),
  resolveAuthProfile: vi.fn(),
  isClinicProfileComplete: vi.fn((profile: { clinic_name?: string | null } | null) =>
    Boolean(profile?.clinic_name?.trim()),
  ),
  isWorkerProfileComplete: vi.fn(
    (profile: { role_types?: string[] | null } | null) => (profile?.role_types?.length ?? 0) > 0,
  ),
}));

vi.mock('@chairside/api', () => apiMocks);

vi.mock('@/lib/setupCompletion', () => ({
  isClinicSetupComplete: (profile: { setup_completed_at?: string | null; clinic_name?: string | null } | null) =>
    Boolean(profile?.setup_completed_at) || Boolean(profile?.clinic_name?.trim()),
  isWorkerSetupComplete: (profile: { setup_completed_at?: string | null; role_types?: string[] | null } | null) =>
    Boolean(profile?.setup_completed_at) || (profile?.role_types?.length ?? 0) > 0,
}));

import { resolveAuthenticatedRoute } from './resolveAuthenticatedRoute';

const refreshProfile = vi.fn(async () => null);

describe('resolveAuthenticatedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends incomplete clinic accounts to setup basics', async () => {
    apiMocks.resolveAuthProfile.mockResolvedValue({ id: 'user-1', role: 'clinic' });
    apiMocks.getClinicProfile.mockResolvedValue({
      id: 'user-1',
      clinic_name: null,
      setup_completed_at: null,
    });

    const result = await resolveAuthenticatedRoute({
      userId: 'user-1',
      profile: null,
      refreshProfile,
    });

    expect(result).toEqual({
      href: '/(clinic-setup)/basics',
      role: 'clinic',
    });
    expect(refreshProfile).toHaveBeenCalled();
  });

  it('sends completed clinic accounts to the clinic dashboard', async () => {
    apiMocks.getClinicProfile.mockResolvedValue({
      id: 'user-1',
      clinic_name: 'Northside Dental',
      setup_completed_at: '2026-01-01T00:00:00.000Z',
    });

    const result = await resolveAuthenticatedRoute({
      userId: 'user-1',
      profile: { id: 'user-1', role: 'clinic' },
      refreshProfile,
    });

    expect(result).toEqual({
      href: '/(clinic-tabs)',
      role: 'clinic',
    });
  });

  it('sends incomplete worker accounts to setup basics', async () => {
    apiMocks.resolveAuthProfile.mockResolvedValue({ id: 'user-2', role: 'worker' });
    apiMocks.getWorkerProfile.mockResolvedValue({
      id: 'user-2',
      role_types: [],
      setup_completed_at: null,
    });

    const result = await resolveAuthenticatedRoute({
      userId: 'user-2',
      profile: null,
      refreshProfile,
    });

    expect(result).toEqual({
      href: '/(worker-setup)/basics',
      role: 'worker',
    });
  });

  it('sends users without a role to role selection', async () => {
    apiMocks.resolveAuthProfile.mockResolvedValue(null);

    const result = await resolveAuthenticatedRoute({
      userId: 'user-3',
      profile: null,
      refreshProfile,
    });

    expect(result).toEqual({
      href: '/(onboarding)/role?fromAuth=1',
      role: null,
    });
  });
});

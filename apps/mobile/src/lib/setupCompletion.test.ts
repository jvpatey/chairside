import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isWorkerProfileComplete: vi.fn(() => false),
  isClinicProfileComplete: vi.fn(() => false),
}));

vi.mock('@chairside/api', () => ({
  isWorkerProfileComplete: mocks.isWorkerProfileComplete,
  isClinicProfileComplete: mocks.isClinicProfileComplete,
}));

import {
  canAccessClinicTabs,
  canAccessWorkerTabs,
  isClinicSetupComplete,
  isWorkerSetupComplete,
} from '@/lib/setupCompletion';

describe('isWorkerSetupComplete', () => {
  it('treats setup_completed_at as enough even if address fields are missing', () => {
    expect(
      isWorkerSetupComplete({
        setup_completed_at: '2026-01-01T00:00:00.000Z',
        role_type: 'hygienist',
        role_types: ['hygienist'],
        address_line1: null,
        city: null,
        postal_code: null,
      }),
    ).toBe(true);
    expect(mocks.isWorkerProfileComplete).not.toHaveBeenCalled();
  });

  it('is false when setup is unfinished and required fields are missing', () => {
    mocks.isWorkerProfileComplete.mockReturnValue(false);
    expect(
      isWorkerSetupComplete({
        setup_completed_at: null,
        role_type: 'hygienist',
        role_types: ['hygienist'],
        address_line1: null,
        city: null,
        postal_code: null,
      }),
    ).toBe(false);
  });
});

describe('canAccessWorkerTabs', () => {
  it('is true only for the worker role', () => {
    expect(canAccessWorkerTabs({ role: 'worker' })).toBe(true);
    expect(canAccessWorkerTabs({ role: 'clinic' })).toBe(false);
    expect(canAccessWorkerTabs(null)).toBe(false);
  });
});

describe('canAccessClinicTabs', () => {
  it('is true only for the clinic role (soft gate; completeness not required)', () => {
    expect(canAccessClinicTabs({ role: 'clinic' })).toBe(true);
    expect(canAccessClinicTabs({ role: 'worker' })).toBe(false);
    expect(canAccessClinicTabs(null)).toBe(false);
  });
});

describe('isClinicSetupComplete', () => {
  it('treats setup_completed_at as enough even if profile details are incomplete', () => {
    expect(
      isClinicSetupComplete({
        setup_completed_at: '2026-01-01T00:00:00.000Z',
        clinic_name: null,
        contact_name: null,
        phone: null,
      } as never),
    ).toBe(true);
    expect(mocks.isClinicProfileComplete).not.toHaveBeenCalled();
  });
});

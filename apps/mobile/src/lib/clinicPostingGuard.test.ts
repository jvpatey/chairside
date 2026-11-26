import { describe, expect, it } from 'vitest';

import {
  CLINIC_CAPTURE_ADDRESS,
  CLINIC_CAPTURE_PHONE,
  CLINIC_FINISH_PROFILE,
} from '@/lib/routing';

import { getClinicPostingSetupHref } from './clinicPostingSetupRouting';

describe('getClinicPostingSetupHref', () => {
  it('routes missing fields to focused capture screens (no clinic-setup wizard)', () => {
    expect(getClinicPostingSetupHref(['Street address'], false)).toBe(CLINIC_CAPTURE_ADDRESS);
    expect(getClinicPostingSetupHref(['A location with a complete address'], true)).toBe(
      CLINIC_CAPTURE_ADDRESS,
    );
    expect(getClinicPostingSetupHref(['Clinic name'], true)).toBe(CLINIC_FINISH_PROFILE);
    expect(getClinicPostingSetupHref(['Phone'], false)).toBe(CLINIC_CAPTURE_PHONE);
  });

  it('prefers clinic name capture when name and address are both missing', () => {
    expect(getClinicPostingSetupHref(['Clinic name', 'Street address'], false)).toBe(
      CLINIC_FINISH_PROFILE,
    );
    expect(getClinicPostingSetupHref(['Phone', 'City'], true)).toBe(CLINIC_CAPTURE_PHONE);
  });
});

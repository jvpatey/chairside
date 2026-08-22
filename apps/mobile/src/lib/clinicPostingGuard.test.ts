import { describe, expect, it } from 'vitest';

import {
  CLINIC_PROFILE_GROUP,
  CLINIC_PROFILE_LOCATIONS,
  CLINIC_PROFILE_MEMBER,
  CLINIC_SETUP_BASICS,
} from '@/lib/routing';

import { getClinicPostingSetupHref } from './clinicPostingSetupRouting';

describe('getClinicPostingSetupHref', () => {
  it('routes individual clinics to basics setup', () => {
    expect(getClinicPostingSetupHref(['Street address'], false)).toBe(CLINIC_SETUP_BASICS);
  });

  it('routes groups missing locations to the locations settings screen', () => {
    expect(getClinicPostingSetupHref(['A clinic location'], true)).toBe(CLINIC_PROFILE_LOCATIONS);
    expect(getClinicPostingSetupHref(['A location with address and software'], true)).toBe(
      CLINIC_PROFILE_LOCATIONS,
    );
  });

  it('routes groups missing clinic name to group details', () => {
    expect(getClinicPostingSetupHref(['Clinic name'], true)).toBe(CLINIC_PROFILE_GROUP);
  });

  it('routes groups missing contact to member profile', () => {
    expect(getClinicPostingSetupHref(['Phone or contact name'], true)).toBe(CLINIC_PROFILE_MEMBER);
  });
});

import { describe, expect, it } from 'vitest';

import {
  getMissingClinicProfileFields,
  isClinicProfileComplete,
  type ClinicProfileCompletenessLocation,
  type ClinicProfileCompletenessProfile,
} from './clinicProfileValidation';

function buildProfile(
  partial: Partial<ClinicProfileCompletenessProfile> = {},
): ClinicProfileCompletenessProfile {
  return {
    account_type: 'individual',
    clinic_name: 'Harbour Dental',
    contact_name: 'Dr. Lee',
    phone: '9025550100',
    address_line1: '1 Main St',
    city: 'Halifax',
    postal_code: 'B3H1A1',
    software_used: ['Dentrix'],
    ...partial,
  };
}

function buildLocation(
  partial: Partial<ClinicProfileCompletenessLocation> = {},
): ClinicProfileCompletenessLocation {
  return {
    is_active: true,
    address_line1: '10 Spring Garden',
    city: 'Halifax',
    postal_code: 'B3J1A1',
    software_used: ['AbelDent'],
    ...partial,
  };
}

describe('isClinicProfileComplete', () => {
  it('requires name, contact, address, and software for a single clinic', () => {
    expect(isClinicProfileComplete(buildProfile())).toBe(true);
    expect(isClinicProfileComplete(buildProfile({ software_used: [] }))).toBe(false);
    expect(isClinicProfileComplete(buildProfile({ address_line1: '' }))).toBe(false);
    expect(getMissingClinicProfileFields(buildProfile({ software_used: [] }))).toContain(
      'Software used',
    );
  });

  it('treats a group as complete when a location has address and software', () => {
    const group = buildProfile({
      account_type: 'group',
      address_line1: '',
      city: '',
      postal_code: '',
      software_used: [],
    });

    expect(isClinicProfileComplete(group)).toBe(false);
    expect(getMissingClinicProfileFields(group)).toContain('A clinic location');
    expect(
      isClinicProfileComplete(group, {
        locations: [buildLocation()],
      }),
    ).toBe(true);
    expect(
      getMissingClinicProfileFields(group, {
        locations: [buildLocation({ software_used: [] })],
      }),
    ).toContain('A location with address and software');
  });

  it('never requires org address or software for groups', () => {
    const group = buildProfile({
      account_type: 'group',
      address_line1: '',
      city: '',
      postal_code: '',
      software_used: [],
    });

    expect(
      getMissingClinicProfileFields(group, {
        locations: [buildLocation()],
      }),
    ).not.toContain('Street address');
    expect(
      getMissingClinicProfileFields(group, {
        locations: [buildLocation()],
      }),
    ).not.toContain('Software used');
  });
});

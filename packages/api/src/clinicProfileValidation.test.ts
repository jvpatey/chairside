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
  it('requires name, phone, and address — not contact name or software', () => {
    expect(isClinicProfileComplete(buildProfile())).toBe(true);
    expect(isClinicProfileComplete(buildProfile({ software_used: [] }))).toBe(true);
    expect(isClinicProfileComplete(buildProfile({ contact_name: '' }))).toBe(true);
    expect(isClinicProfileComplete(buildProfile({ address_line1: '' }))).toBe(false);
    expect(isClinicProfileComplete(buildProfile({ phone: '' }))).toBe(false);
    expect(isClinicProfileComplete(buildProfile({ clinic_name: '' }))).toBe(false);
  });

  it('accepts a complete address on clinic_locations when profile address is empty', () => {
    const group = buildProfile({
      account_type: 'group',
      address_line1: '',
      city: '',
      postal_code: '',
      contact_name: '',
    });

    expect(isClinicProfileComplete(group)).toBe(false);
    expect(getMissingClinicProfileFields(group)).toContain('Street address');
    expect(
      isClinicProfileComplete(group, {
        locations: [buildLocation()],
      }),
    ).toBe(true);
    expect(
      getMissingClinicProfileFields(group, {
        locations: [buildLocation({ address_line1: '' })],
      }),
    ).toContain('A location with a complete address');
  });

  it('always requires phone even for group accounts', () => {
    const group = buildProfile({
      account_type: 'group',
      phone: '',
      contact_name: 'Office Manager',
      address_line1: '',
      city: '',
      postal_code: '',
    });

    expect(
      isClinicProfileComplete(group, {
        locations: [buildLocation()],
      }),
    ).toBe(false);
    expect(
      getMissingClinicProfileFields(group, {
        locations: [buildLocation()],
      }),
    ).toContain('Phone');
  });
});

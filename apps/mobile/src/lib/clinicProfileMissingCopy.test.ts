import { describe, expect, it } from 'vitest';

import { getClinicMissingDetails } from './clinicProfileMissingCopy';

describe('getClinicMissingDetails', () => {
  it('describes each missing field in plain language', () => {
    expect(getClinicMissingDetails(['Clinic name', 'Phone'])).toEqual([
      {
        label: 'Clinic name',
        hint: 'Shown to professionals on every fill-in.',
      },
      {
        label: 'Phone',
        hint: 'Where professionals reach you about cover requests.',
      },
    ]);
  });

  it('collapses street, city, and postal code into one Address row', () => {
    const details = getClinicMissingDetails(['Street address', 'City', 'Postal code']);

    expect(details).toHaveLength(1);
    expect(details[0]?.label).toBe('Address');
    expect(details[0]?.hint).toBeTruthy();
  });

  it('uses the location-address copy for group accounts with no complete location', () => {
    expect(getClinicMissingDetails(['Phone', 'A location with a complete address'])).toEqual([
      expect.objectContaining({ label: 'Phone' }),
      { label: 'Address', hint: 'Add a full address to at least one clinic.' },
    ]);
  });

  it('falls back to the raw field name for unknown fields', () => {
    expect(getClinicMissingDetails(['Something new'])).toEqual([{ label: 'Something new' }]);
  });

  it('returns an empty list when nothing is missing', () => {
    expect(getClinicMissingDetails([])).toEqual([]);
  });
});

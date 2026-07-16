import { describe, expect, it } from 'vitest';

import type { ClinicLocation } from './clinicOrganizationTypes';
import {
  filterLocationsForMembership,
  formatPosterAttribution,
} from './clinicOrganizationUtils';
import { isClinicGroupsEnabled } from './featureFlags';

function makeLocation(overrides: Partial<ClinicLocation> = {}): ClinicLocation {
  return {
    id: 'loc-1',
    organization_id: 'org-1',
    name: 'Downtown',
    address_line1: '1 Main St',
    address_line2: null,
    city: 'Halifax',
    province: 'NS',
    postal_code: 'B3H1A1',
    latitude: null,
    longitude: null,
    phone: null,
    contact_name: null,
    specialty: 'general',
    software_used: [],
    operatories_count: null,
    team_size_range: null,
    logo_storage_path: null,
    logo_uploaded_at: null,
    is_primary: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('formatPosterAttribution', () => {
  it('formats name and title', () => {
    expect(formatPosterAttribution({ displayName: 'Sarah', title: 'Office Manager' })).toBe(
      'Sarah, Office Manager',
    );
  });

  it('returns null without a name', () => {
    expect(formatPosterAttribution({ displayName: '  ', title: 'Manager' })).toBeNull();
  });
});

describe('filterLocationsForMembership', () => {
  const locations = [
    makeLocation({ id: 'a', is_active: true }),
    makeLocation({ id: 'b', is_active: true, is_primary: false, name: 'Bedford' }),
    makeLocation({ id: 'c', is_active: false, is_primary: false, name: 'Closed' }),
  ];

  it('returns all active locations for owners', () => {
    expect(filterLocationsForMembership(locations, 'all').map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('returns only assigned active locations for managers', () => {
    expect(filterLocationsForMembership(locations, ['b', 'c']).map((l) => l.id)).toEqual(['b']);
  });
});

describe('isClinicGroupsEnabled', () => {
  it('defaults to enabled', () => {
    expect(isClinicGroupsEnabled()).toBe(true);
  });
});

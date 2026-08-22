import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  getWorkerRoleTypes: () => [],
  isClinicLocationRecordComplete: (location: {
    address_line1?: string | null;
    software_used?: string[] | null;
  }) => Boolean(location.address_line1?.trim()) && (location.software_used?.length ?? 0) > 0,
  isClinicProfileComplete: () => true,
  isWorkerProfileComplete: () => true,
}));

import {
  getClinicAboutSubtitle,
  getClinicGroupDetailsSubtitle,
  getClinicLocationsSubtitle,
  getClinicMessagingSubtitle,
} from '@/lib/profileHubSubtitles';

describe('getClinicMessagingSubtitle', () => {
  it('distinguishes locked Free from off-by-choice', () => {
    expect(getClinicMessagingSubtitle(null, { locked: true })).toBe('Upgrade for open inquiries');
    expect(
      getClinicMessagingSubtitle({ accepts_general_candidate_messages: true } as never),
    ).toBe('Open to inquiries');
    expect(
      getClinicMessagingSubtitle({ accepts_general_candidate_messages: false } as never),
    ).toBe('Not open to inquiries');
  });
});

describe('getClinicGroupDetailsSubtitle', () => {
  it('shows missing copy when name and phone are empty', () => {
    expect(getClinicGroupDetailsSubtitle({ clinic_name: '', phone: '' } as never)).toBe(
      'Add group name and phone',
    );
  });

  it('shows group name when only name is set', () => {
    expect(getClinicGroupDetailsSubtitle({ clinic_name: 'Smile Group', phone: '' } as never)).toBe(
      'Smile Group',
    );
  });
});

describe('getClinicLocationsSubtitle', () => {
  it('flags incomplete location software', () => {
    expect(
      getClinicLocationsSubtitle({
        isOwner: true,
        locations: [
          {
            is_active: true,
            name: 'Downtown',
            address_line1: '1 Main St',
            city: 'Halifax',
            postal_code: 'B3H 1A1',
            software_used: [],
          },
        ],
      }),
    ).toBe('Add software to Downtown');
  });

  it('shows location count when all locations are complete', () => {
    expect(
      getClinicLocationsSubtitle({
        isOwner: true,
        locations: [
          {
            is_active: true,
            name: 'Downtown',
            address_line1: '1 Main St',
            city: 'Halifax',
            postal_code: 'B3H 1A1',
            software_used: ['Dentrix'],
          },
        ],
      }),
    ).toBe('1 location');
  });
});

describe('getClinicAboutSubtitle', () => {
  it('mentions practice doctors for groups', () => {
    expect(
      getClinicAboutSubtitle(
        { description: 'Great team', website: 'https://example.com' } as never,
        { isGroup: true, doctorCount: 2 },
      ),
    ).toBe('Description, website, and 2 doctors');
  });
});

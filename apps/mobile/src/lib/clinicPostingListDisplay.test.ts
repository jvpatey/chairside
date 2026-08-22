import { describe, expect, it } from 'vitest';

import {
  CLINIC_ROLE_TABLE_COLUMNS,
  clinicPostingTableGridTemplate,
  formatClinicApplicantCount,
  formatClinicPostingLocation,
  formatClinicPostingPostedDate,
  formatClinicPostingTableLocation,
  formatClinicRoleCompactMeta,
  getClinicRoleTableColumns,
  resolveClinicJobLocationLabel,
} from './clinicPostingListDisplay';

describe('clinicPostingListDisplay', () => {
  it('omits location for single-site clinics and includes it for groups', () => {
    expect(getClinicRoleTableColumns(false).map((column) => column.key)).toEqual([
      'role',
      'status',
      'applicants',
      'posted',
      'pay',
      'actions',
    ]);
    expect(getClinicRoleTableColumns(true).map((column) => column.key)).toEqual([
      'role',
      'status',
      'location',
      'applicants',
      'posted',
      'pay',
      'actions',
    ]);
    expect(clinicPostingTableGridTemplate(getClinicRoleTableColumns(false))).toBe(
      'minmax(240px, 2.4fr) 104px 148px 96px minmax(92px, 0.9fr) 44px',
    );
    expect(CLINIC_ROLE_TABLE_COLUMNS).toEqual(getClinicRoleTableColumns(true));
  });

  it('formats location, counts, and posted dates', () => {
    expect(formatClinicPostingLocation('Downtown', 'Halifax', 'NS')).toBe(
      'Downtown · Halifax, NS',
    );
    expect(formatClinicPostingLocation(null, 'Halifax', 'NS')).toBe('Halifax, NS');
    expect(formatClinicPostingLocation(null, null, null)).toBe('');
    expect(formatClinicPostingTableLocation('Downtown', 'Halifax')).toBe('Downtown');
    expect(formatClinicPostingTableLocation(null, 'Halifax')).toBe('Halifax');
    expect(formatClinicApplicantCount(1)).toBe('1 applicant');
    expect(formatClinicApplicantCount(3)).toBe('3 applicants');
    expect(formatClinicPostingPostedDate('2026-01-15T15:00:00.000Z')).toMatch(/Jan 15/);
    expect(formatClinicPostingPostedDate('2026-01-15T15:00:00.000Z')).not.toMatch(/2026/);
    expect(formatClinicPostingPostedDate(null)).toBe('—');
  });

  it('resolves clinic job location labels from location_id', () => {
    expect(
      resolveClinicJobLocationLabel(
        { location_id: 'loc-1' },
        [{ id: 'loc-1', name: 'Downtown', city: 'Halifax', province: 'NS' }],
        { city: 'Bedford', province: 'NS' },
      ),
    ).toBe('Downtown · Halifax, NS');
    expect(
      resolveClinicJobLocationLabel({ location_id: null }, [], { city: 'Halifax', province: 'NS' }),
    ).toBe('Halifax, NS');
  });

  it('formats compact role meta lines', () => {
    const roleMeta = formatClinicRoleCompactMeta(
      {
        role_type: 'hygienist',
        employment_type: 'permanent',
        created_at: '2026-01-15T15:00:00.000Z',
      },
      2,
    );
    expect(roleMeta).toContain('Dental Hygienist');
    expect(roleMeta).toContain('Full Time');
    expect(roleMeta).toContain('2 applicants');
    expect(roleMeta).toContain('Posted');
  });
});

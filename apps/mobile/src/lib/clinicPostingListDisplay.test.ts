import { describe, expect, it } from 'vitest';

import {
  CLINIC_ROLE_TABLE_COLUMNS,
  clinicPostingTableGridTemplate,
  formatClinicApplicantCount,
  formatClinicPostingLocation,
  formatClinicPostingPostedDate,
  formatClinicRoleCompactMeta,
} from './clinicPostingListDisplay';

describe('clinicPostingListDisplay', () => {
  it('builds CSS grid templates from table columns', () => {
    expect(clinicPostingTableGridTemplate(CLINIC_ROLE_TABLE_COLUMNS)).toContain('minmax(140px, 2.2fr)');
    expect(CLINIC_ROLE_TABLE_COLUMNS.map((column) => column.label)).toEqual([
      'Role',
      'Type',
      'Status',
      'Location',
      'Applicants',
      'Posted',
      'Pay',
      '',
    ]);
  });

  it('formats location, counts, and posted dates', () => {
    expect(formatClinicPostingLocation('Downtown', 'Halifax', 'NS')).toBe(
      'Downtown · Halifax, NS',
    );
    expect(formatClinicPostingLocation(null, 'Halifax', 'NS')).toBe('Halifax, NS');
    expect(formatClinicPostingLocation(null, null, null)).toBe('');
    expect(formatClinicApplicantCount(1)).toBe('1 applicant');
    expect(formatClinicApplicantCount(3)).toBe('3 applicants');
    expect(formatClinicPostingPostedDate('2026-01-15T15:00:00.000Z')).toMatch(/Jan 15, 2026/);
    expect(formatClinicPostingPostedDate(null)).toBe('—');
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

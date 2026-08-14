import { describe, expect, it } from 'vitest';

import { getWelcomeHeroPreview, WELCOME_HERO_CLINIC, WELCOME_HERO_WORKER } from './welcomeHeroPreview';

const NOW = new Date('2026-08-13T15:00:00.000Z');

describe('getWelcomeHeroPreview', () => {
  const preview = getWelcomeHeroPreview(NOW);

  it('uses a generic clinic and worker story', () => {
    expect(preview.clinic).toEqual(WELCOME_HERO_CLINIC);
    expect(preview.job.title).toBe('Dental Hygienist');
    expect(preview.job.role_type).toBe('hygienist');
    expect(preview.job.status).toBe('live');
    expect(preview.shift.clinic.clinic_name).toBe(WELCOME_HERO_CLINIC.name);
    expect(preview.shift.clinic.logo_storage_path).toBeNull();
    expect(preview.job.clinic.clinic_name).toBe(WELCOME_HERO_CLINIC.name);
    expect(preview.job.has_priority_listing).toBe(false);
    expect(preview.shift.urgency).toBe('same_day');
    expect(preview.shift.shift_date).toBe('2026-08-13');
    expect(preview.workerFirstName).toBe(WELCOME_HERO_WORKER.firstName);
  });

  it('keeps applicant photos off the network', () => {
    expect(preview.applicants.map((applicant) => applicant.photoPath)).toEqual([null, null, null]);
    expect(preview.applicants.map((applicant) => applicant.name)).toEqual(['John', 'Sam', 'Riley']);
  });

  it('computes real match tiers from calculateJobMatch', () => {
    expect(preview.applicants.map((applicant) => applicant.match.tier)).toEqual([
      'strong',
      'good',
      'partial',
    ]);
  });

  it('keeps clinic and worker stats aligned', () => {
    expect(preview.stats).toEqual({
      openRoles: 1,
      fillIns: 1,
      applications: 3,
    });
    expect(preview.workerStats).toEqual({
      openRoles: 1,
      fillIns: 1,
      applications: 1,
    });
  });

  it('gives applications the same clinic-dashboard card fields', () => {
    expect(preview.applicants.map((applicant) => ({
      name: applicant.name,
      status: applicant.status,
      isNew: applicant.isNew,
      education: applicant.education,
      yearsOfExperience: applicant.yearsOfExperience,
    }))).toEqual([
      { name: 'John', status: 'applied', isNew: true, education: 'diploma', yearsOfExperience: 8 },
      { name: 'Sam', status: 'reviewed', isNew: false, education: 'bachelors', yearsOfExperience: 5 },
      { name: 'Riley', status: 'applied', isNew: false, education: 'diploma', yearsOfExperience: 3 },
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { scoreEmploymentMatch } from './employmentMatch';
import { calculateJobMatch, deriveMatchTier, getMatchCriterionDetails } from './matchScore';

describe('scoreEmploymentMatch', () => {
  it('returns partial when worker has no preferences', () => {
    expect(scoreEmploymentMatch('permanent', [])).toBe('partial');
    expect(scoreEmploymentMatch('permanent', null)).toBe('partial');
  });

  it('returns strong when job type is preferred', () => {
    expect(scoreEmploymentMatch('permanent', ['permanent', 'part-time'])).toBe('strong');
  });

  it('returns missing when job type is not preferred', () => {
    expect(scoreEmploymentMatch('temp', ['permanent', 'part-time'])).toBe('missing');
  });
});

describe('deriveMatchTier', () => {
  it('returns none when role or location is missing', () => {
    expect(
      deriveMatchTier({
        roleFit: 'missing',
        software: 'strong',
        location: 'strong',
        employmentType: 'strong',
        postHasMatchableSoftware: true,
      }),
    ).toBe('none');

    expect(
      deriveMatchTier({
        roleFit: 'strong',
        software: 'strong',
        location: 'missing',
        employmentType: 'strong',
        postHasMatchableSoftware: true,
      }),
    ).toBe('none');
  });

  it('returns strong for a fully aligned match', () => {
    expect(
      deriveMatchTier({
        roleFit: 'strong',
        software: 'strong',
        location: 'strong',
        employmentType: 'strong',
        postHasMatchableSoftware: true,
      }),
    ).toBe('strong');
  });

  it('returns good with one secondary gap', () => {
    expect(
      deriveMatchTier({
        roleFit: 'strong',
        software: 'missing',
        location: 'strong',
        employmentType: 'strong',
        postHasMatchableSoftware: true,
      }),
    ).toBe('good');
  });

  it('returns partial with multiple secondary gaps', () => {
    expect(
      deriveMatchTier({
        roleFit: 'strong',
        software: 'missing',
        location: 'partial',
        employmentType: 'missing',
        postHasMatchableSoftware: true,
      }),
    ).toBe('partial');
  });
});

describe('calculateJobMatch', () => {
  it('computes a strong match for aligned worker and job', () => {
    const result = calculateJobMatch({
      postRoleType: 'hygienist',
      workerRoleType: 'hygienist',
      postEmploymentType: 'permanent',
      workerPreferredEmploymentTypes: ['permanent'],
      postSoftware: ['Dentrix'],
      workerSoftware: ['Dentrix'],
      distanceKm: 8,
      workerTravelRadiusKm: 25,
    });

    expect(result.tier).toBe('strong');
    expect(result.roleFit).toBe('strong');
    expect(result.employmentType).toBe('strong');
  });

  it('computes none when role does not match', () => {
    const result = calculateJobMatch({
      postRoleType: 'hygienist',
      workerRoleType: 'assistant',
      postEmploymentType: 'permanent',
      workerPreferredEmploymentTypes: ['permanent'],
      postSoftware: ['Dentrix'],
      workerSoftware: ['Dentrix'],
      distanceKm: 8,
      workerTravelRadiusKm: 25,
    });

    expect(result.tier).toBe('none');
    expect(result.roleFit).toBe('missing');
  });
});

describe('getMatchCriterionDetails', () => {
  it('describes partial software using overlap, not all required software', () => {
    const breakdown = calculateJobMatch({
      postRoleType: 'hygienist',
      workerRoleType: 'hygienist',
      postEmploymentType: 'permanent',
      workerPreferredEmploymentTypes: ['permanent'],
      postSoftware: ['Dentrix', 'Open Dental'],
      workerSoftware: ['Dentrix'],
      distanceKm: 8,
      workerTravelRadiusKm: 25,
    });

    const details = getMatchCriterionDetails(breakdown, {
      postSoftware: ['Dentrix', 'Open Dental'],
      workerSoftware: ['Dentrix'],
    });
    const software = details.find((item) => item.id === 'software');

    expect(software?.level).toBe('partial');
    expect(software?.explanation).toContain('dentrix');
    expect(software?.explanation).toContain('open dental');
    expect(software?.explanation).not.toBe(
      'You know some required software (dentrix and open dental).',
    );
  });
});

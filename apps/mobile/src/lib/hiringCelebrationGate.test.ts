import { describe, expect, it } from 'vitest';

import type { CelebrationCandidate } from './hiringCelebrationCandidates';
import {
  HIRING_CELEBRATION_MAX_AGE_MS,
  pickWorkerHiringCelebration,
} from './hiringCelebrationGate';

function candidate(
  overrides: Partial<CelebrationCandidate> & Pick<CelebrationCandidate, 'id' | 'status'>,
): CelebrationCandidate {
  return {
    postType: 'job',
    counterpartName: 'Dental Clinic',
    postTitle: 'Dental Hygienist',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('pickWorkerHiringCelebration', () => {
  const now = Date.parse('2026-08-11T21:30:00.000Z');

  it('does not celebrate an older hire when visiting applications later', () => {
    const olderHire = candidate({
      id: 'hygienist-hire',
      status: 'selected',
      postTitle: 'Dental Hygienist',
      updatedAt: new Date(now - HIRING_CELEBRATION_MAX_AGE_MS - 60_000).toISOString(),
    });
    const screening = candidate({
      id: 'office-manager',
      status: 'screening_submitted',
      postTitle: 'Office Manager',
      updatedAt: new Date(now).toISOString(),
    });

    const result = pickWorkerHiringCelebration([olderHire, screening], [], now);

    expect(result.toShow).toBeNull();
    expect([...result.nextKnownHiredIds]).toEqual(['hygienist-hire']);
  });

  it('celebrates a newly seen recent hire', () => {
    const recentHire = candidate({
      id: 'hygienist-hire',
      status: 'selected',
      updatedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    });

    const result = pickWorkerHiringCelebration([recentHire], [], now);

    expect(result.toShow?.id).toBe('hygienist-hire');
    expect(result.nextKnownHiredIds.has('hygienist-hire')).toBe(false);
  });

  it('does not re-celebrate a hire that was already seen', () => {
    const recentHire = candidate({
      id: 'hygienist-hire',
      status: 'selected',
      updatedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    });
    const screening = candidate({
      id: 'office-manager',
      status: 'screening_submitted',
      postTitle: 'Office Manager',
    });

    const result = pickWorkerHiringCelebration(
      [recentHire, screening],
      ['hygienist-hire'],
      now,
    );

    expect(result.toShow).toBeNull();
    expect(result.nextKnownHiredIds.has('hygienist-hire')).toBe(true);
  });
});

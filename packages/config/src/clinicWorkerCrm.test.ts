import { describe, expect, it } from 'vitest';

import {
  formatClinicWorkerCrmFollowUpLabel,
  isClinicWorkerCrmFollowUpDue,
  normalizeClinicWorkerCrmTags,
} from './clinicWorkerCrm';

describe('normalizeClinicWorkerCrmTags', () => {
  it('keeps only known preset tags in order', () => {
    expect(
      normalizeClinicWorkerCrmTags([
        'strong_candidate',
        'unknown',
        'worked_here_before',
        'strong_candidate',
      ]),
    ).toEqual(['strong_candidate', 'worked_here_before']);
  });
});

describe('formatClinicWorkerCrmFollowUpLabel', () => {
  it('marks overdue follow-ups', () => {
    expect(
      formatClinicWorkerCrmFollowUpLabel('2026-01-01T12:00:00.000Z', new Date('2026-06-19T12:00:00.000Z')),
    ).toBe('Follow-up overdue');
  });

  it('marks follow-ups due today', () => {
    expect(
      formatClinicWorkerCrmFollowUpLabel('2026-06-19T08:00:00.000Z', new Date('2026-06-19T20:00:00.000Z')),
    ).toBe('Follow-up today');
  });
});

describe('isClinicWorkerCrmFollowUpDue', () => {
  it('returns true for today and past dates', () => {
    const now = new Date('2026-06-19T20:00:00.000Z');
    expect(isClinicWorkerCrmFollowUpDue('2026-06-18T12:00:00.000Z', now)).toBe(true);
    expect(isClinicWorkerCrmFollowUpDue('2026-06-19T08:00:00.000Z', now)).toBe(true);
    expect(isClinicWorkerCrmFollowUpDue('2026-06-20T08:00:00.000Z', now)).toBe(false);
  });
});

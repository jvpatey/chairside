import type { JobPost, ShiftPost } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import { sortClinicFillInPosts, sortClinicRolePosts } from './postingFilters';

function job(overrides: Partial<JobPost> & Pick<JobPost, 'id'>): JobPost {
  return {
    clinic_id: 'clinic-1',
    role_type: 'hygienist',
    employment_type: 'permanent',
    title: overrides.title ?? overrides.id,
    wage_range: null,
    schedule: null,
    description: null,
    required_qualifications: [],
    preferred_qualifications: [],
    specialty: '',
    software_used: [],
    start_date: null,
    benefits: null,
    offerings: [],
    screening_enabled: false,
    status: 'live',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

function shift(overrides: Partial<ShiftPost> & Pick<ShiftPost, 'id'>): ShiftPost {
  return {
    clinic_id: 'clinic-1',
    role_type: 'hygienist',
    shift_date: '2026-08-20',
    start_time: '09:00',
    end_time: '17:00',
    compensation: null,
    urgency: 'normal',
    description: null,
    status: 'live',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('sortClinicRolePosts', () => {
  const jobs = [
    job({ id: 'older', created_at: '2026-01-01T10:00:00.000Z', updated_at: '2026-02-01T10:00:00.000Z' }),
    job({ id: 'newer', created_at: '2026-03-01T10:00:00.000Z', updated_at: '2026-03-01T10:00:00.000Z' }),
    job({ id: 'updated', created_at: '2026-02-01T10:00:00.000Z', updated_at: '2026-04-01T10:00:00.000Z' }),
  ];

  it('sorts newest posted first by default', () => {
    expect(sortClinicRolePosts(jobs, 'newest').map((item) => item.id)).toEqual([
      'newer',
      'updated',
      'older',
    ]);
  });

  it('sorts oldest posted first', () => {
    expect(sortClinicRolePosts(jobs, 'oldest').map((item) => item.id)).toEqual([
      'older',
      'updated',
      'newer',
    ]);
  });

  it('sorts by last updated', () => {
    expect(sortClinicRolePosts(jobs, 'updated').map((item) => item.id)).toEqual([
      'updated',
      'newer',
      'older',
    ]);
  });

  it('sorts by most applicants and falls back to newest', () => {
    expect(
      sortClinicRolePosts(jobs, 'applicants', { newer: 1, older: 4, updated: 4 }).map(
        (item) => item.id,
      ),
    ).toEqual(['updated', 'older', 'newer']);
  });
});

describe('sortClinicFillInPosts', () => {
  const shifts = [
    shift({
      id: 'later-shift',
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-02-01T10:00:00.000Z',
      shift_date: '2026-09-01',
      start_time: '08:00',
    }),
    shift({
      id: 'soonest',
      created_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-03-01T10:00:00.000Z',
      shift_date: '2026-08-12',
      start_time: '13:00',
    }),
    shift({
      id: 'same-day-earlier',
      created_at: '2026-02-01T10:00:00.000Z',
      updated_at: '2026-04-01T10:00:00.000Z',
      shift_date: '2026-08-12',
      start_time: '08:00',
    }),
  ];

  it('sorts newest posted first by default', () => {
    expect(sortClinicFillInPosts(shifts, 'newest').map((item) => item.id)).toEqual([
      'soonest',
      'same-day-earlier',
      'later-shift',
    ]);
  });

  it('sorts by shift date then start time', () => {
    expect(sortClinicFillInPosts(shifts, 'shift_date').map((item) => item.id)).toEqual([
      'same-day-earlier',
      'soonest',
      'later-shift',
    ]);
  });

  it('sorts by most requests and falls back to newest', () => {
    expect(
      sortClinicFillInPosts(shifts, 'requests', {
        'later-shift': 5,
        soonest: 5,
        'same-day-earlier': 1,
      }).map((item) => item.id),
    ).toEqual(['soonest', 'later-shift', 'same-day-earlier']);
  });
});

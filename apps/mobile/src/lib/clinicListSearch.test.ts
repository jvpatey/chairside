import type { JobApplicationSummary, JobPost } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  matchesClinicApplicationSummaryFilter,
  matchesJobApplicationSummarySearch,
  matchesJobPostSearch,
} from '@/lib/clinicListSearch';

describe('clinicListSearch', () => {
  it('matches job posts by title and role type', () => {
    const job = {
      id: 'job-1',
      title: 'Dental Hygienist',
      role_type: 'hygienist',
      status: 'live',
      description: null,
      wage_range: null,
      schedule: null,
    } as JobPost;

    expect(matchesJobPostSearch(job, 'hygienist')).toBe(true);
    expect(matchesJobPostSearch(job, 'receptionist')).toBe(false);
  });

  it('matches application summaries by role title', () => {
    const summary = {
      job_post_id: 'job-1',
      post_title: 'Front Desk Coordinator',
      post_created_at: null,
      applicant_count: 2,
      screening_count: 0,
      pending_count: 1,
      unseen_count: 1,
      shortlisted_count: 0,
      interview_count: 0,
    } satisfies JobApplicationSummary;

    expect(matchesJobApplicationSummarySearch(summary, 'front desk')).toBe(true);
    expect(matchesClinicApplicationSummaryFilter(summary, 'needs_attention')).toBe(true);
    expect(matchesClinicApplicationSummaryFilter(summary, 'all')).toBe(true);
  });
});

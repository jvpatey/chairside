import type { JobApplicationSummary, JobPost, OpenInquiryWorker } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  matchesClinicApplicationSummaryFilter,
  matchesConfirmedFillInSearch,
  matchesJobApplicationSummarySearch,
  matchesJobPostSearch,
  matchesOpenInquiryWorkerSearch,
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
      post_status: 'live',
      applicant_count: 2,
      screening_count: 0,
      pending_count: 1,
      unseen_count: 0,
      action_needed_count: 1,
      shortlisted_count: 0,
      interview_count: 0,
    } satisfies JobApplicationSummary;

    expect(matchesJobApplicationSummarySearch(summary, 'front desk')).toBe(true);
    expect(matchesClinicApplicationSummaryFilter(summary, 'needs_attention')).toBe(true);
    expect(matchesClinicApplicationSummaryFilter(summary, 'all')).toBe(true);
    expect(
      matchesClinicApplicationSummaryFilter({ ...summary, post_status: 'filled' }, 'all'),
    ).toBe(false);
  });

  it('matches confirmed fill-ins by worker name', () => {
    const row = {
      workerName: 'Jeffrey Patey',
      postTitle: 'Dental Hygienist',
      shiftDate: '2026-08-10',
    };

    expect(matchesConfirmedFillInSearch(row, 'jeffrey')).toBe(true);
    expect(matchesConfirmedFillInSearch(row, 'assistant')).toBe(false);
  });

  it('matches open inquiry candidates by name, city, bio, and role', () => {
    const worker = {
      workerId: 'w1',
      displayName: 'Ada Lovelace',
      roleTypes: ['hygienist'],
      city: 'Halifax',
      yearsOfExperience: 4,
      bio: 'Loves perio.',
      photoStoragePath: null,
      existingConversationId: null,
    } satisfies OpenInquiryWorker;

    expect(matchesOpenInquiryWorkerSearch(worker, 'ada')).toBe(true);
    expect(matchesOpenInquiryWorkerSearch(worker, 'halifax')).toBe(true);
    expect(matchesOpenInquiryWorkerSearch(worker, 'perio')).toBe(true);
    expect(matchesOpenInquiryWorkerSearch(worker, 'hygienist')).toBe(true);
    expect(matchesOpenInquiryWorkerSearch(worker, 'assistant')).toBe(false);
  });
});

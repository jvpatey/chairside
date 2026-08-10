import { describe, expect, it } from 'vitest';

import {
  formatFillInInquiryPostTitle,
  formatFillInPostTitle,
  formatISODateLabel,
  formatJobApplicationSummaryMeta,
  formatPostTitleDisplay,
  isWorkerJobApplicationPipelineActive,
} from './applicationDisplay';

describe('formatISODateLabel', () => {
  it('formats ISO dates as month day, year', () => {
    expect(formatISODateLabel('2026-06-29')).toMatch(/Jun 29, 2026/);
    expect(formatISODateLabel('2026-05-26')).toMatch(/May 26, 2026/);
  });

  it('returns the original value when not ISO', () => {
    expect(formatISODateLabel('Jun 29, 2026')).toBe('Jun 29, 2026');
  });
});

describe('formatFillInPostTitle', () => {
  it('builds a readable fill-in title', () => {
    expect(formatFillInPostTitle('2026-06-29')).toBe('Fill-in · Jun 29, 2026');
  });
});

describe('formatFillInInquiryPostTitle', () => {
  it('builds a readable inquiry title', () => {
    expect(formatFillInInquiryPostTitle('2026-06-29')).toBe(
      'Fill-in inquiry · Jun 29, 2026',
    );
  });
});

describe('formatJobApplicationSummaryMeta', () => {
  it('shows action and new counts separately', () => {
    expect(
      formatJobApplicationSummaryMeta({
        applicant_count: 3,
        pending_count: 1,
        unseen_count: 1,
        action_needed_count: 2,
        screening_count: 0,
        shortlisted_count: 0,
        interview_count: 0,
      }),
    ).toBe('2 to review · 1 new');
  });
});

describe('isWorkerJobApplicationPipelineActive', () => {
  it('counts interview invitations as active pipeline applications', () => {
    expect(
      isWorkerJobApplicationPipelineActive({
        status: 'interview_offered',
        post_status: 'live',
      }),
    ).toBe(true);
  });

  it('excludes applications on filled or closed roles', () => {
    expect(
      isWorkerJobApplicationPipelineActive({
        status: 'interview_offered',
        post_status: 'filled',
      }),
    ).toBe(false);
  });

  it('treats hired and declined applications as past (not active pipeline)', () => {
    expect(
      isWorkerJobApplicationPipelineActive({
        status: 'selected',
        post_status: 'filled',
      }),
    ).toBe(false);
    expect(
      isWorkerJobApplicationPipelineActive({
        status: 'hired',
        post_status: 'filled',
      }),
    ).toBe(false);
    expect(
      isWorkerJobApplicationPipelineActive({
        status: 'rejected',
        post_status: 'live',
      }),
    ).toBe(false);
  });
});

describe('formatPostTitleDisplay', () => {
  it('rewrites ISO fill-in titles', () => {
    expect(formatPostTitleDisplay('Fill-in · 2026-06-29')).toBe('Fill-in · Jun 29, 2026');
    expect(formatPostTitleDisplay('Fill-in inquiry · 2026-06-29')).toBe(
      'Fill-in inquiry · Jun 29, 2026',
    );
  });

  it('leaves job titles unchanged', () => {
    expect(formatPostTitleDisplay('Dental Hygienist')).toBe('Dental Hygienist');
  });

  it('leaves already formatted fill-in titles unchanged', () => {
    expect(formatPostTitleDisplay('Fill-in · Jun 29, 2026')).toBe('Fill-in · Jun 29, 2026');
  });
});

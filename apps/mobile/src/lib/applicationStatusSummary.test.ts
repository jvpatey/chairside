import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  FILL_IN_PENDING_STATUSES: ['applied', 'in_progress'],
}));

import { getApplicationStatusSummary } from './applicationStatusSummary';

describe('getApplicationStatusSummary interview counter-offer', () => {
  it('shows suggestion-sent copy for workers after they counter an invite', () => {
    const summary = getApplicationStatusSummary(
      {
        status: 'interview_offered',
        postType: 'job',
        interviewProposedAt: '2026-08-20T15:00:00.000Z',
        interviewProposedBy: 'worker',
      },
      'worker',
    );

    expect(summary?.headline).toBe('Suggestion sent');
    expect(summary?.nextStep).toMatch(/edit your suggestion/i);
  });

  it('shows candidate-suggested copy for clinics when a counter is pending', () => {
    const summary = getApplicationStatusSummary(
      {
        status: 'interview_offered',
        postType: 'job',
        interviewProposedAt: '2026-08-20T15:00:00.000Z',
        interviewProposedBy: 'worker',
        counterpartFirstName: 'Jordan',
      },
      'clinic',
    );

    expect(summary?.headline).toBe('Jordan suggested a new time');
    expect(summary?.description).toMatch(/^Jordan is interested/);
    expect(summary?.nextStep).toMatch(/Accept their suggestion/i);
  });

  it('falls back to Applicant when no first name is provided', () => {
    const summary = getApplicationStatusSummary(
      {
        status: 'interview_offered',
        postType: 'job',
        interviewProposedAt: '2026-08-20T15:00:00.000Z',
        interviewProposedBy: 'worker',
      },
      'clinic',
    );

    expect(summary?.headline).toBe('Applicant suggested a new time');
  });

  it('keeps the invite copy when no counter is pending', () => {
    const summary = getApplicationStatusSummary(
      {
        status: 'interview_offered',
        postType: 'job',
      },
      'worker',
    );

    expect(summary?.headline).toBe('Interview invitation');
  });
});

describe('getApplicationStatusSummary confirmed fill-ins', () => {
  it('keeps upcoming hired fill-ins in the present tense', () => {
    const summary = getApplicationStatusSummary(
      {
        status: 'hired',
        postType: 'shift',
        shiftDate: '2099-01-01',
      },
      'worker',
    );

    expect(summary?.headline).toBe('Fill-in confirmed');
    expect(summary?.description).toBe('This fill-in was confirmed.');
  });

  it('switches past hired fill-ins to filled-in copy', () => {
    const workerSummary = getApplicationStatusSummary(
      {
        status: 'hired',
        postType: 'shift',
        shiftDate: '2020-01-01',
      },
      'worker',
    );
    const clinicSummary = getApplicationStatusSummary(
      {
        status: 'hired',
        postType: 'shift',
        shiftDate: '2020-01-01',
        counterpartFirstName: 'Alex',
      },
      'clinic',
    );

    expect(workerSummary?.headline).toBe('Filled in');
    expect(workerSummary?.description).toBe('You filled in on this day.');
    expect(clinicSummary?.headline).toBe('Filled in');
    expect(clinicSummary?.description).toBe('Alex filled in on this day.');
  });
});

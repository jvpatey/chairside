import type { WorkerApplication } from '@chairside/api';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/applicationStatusSummary', () => ({
  getApplicationStatusSummary: (
    application: { status: string; postType: string },
    audience: 'worker' | 'clinic',
  ) => {
    if (audience !== 'worker' || application.postType !== 'job') return null;
    if (application.status === 'reviewed') {
      return {
        headline: 'Application viewed',
        description: 'The clinic viewed your application.',
        nextStep: 'They may shortlist you or follow up with next steps.',
        variant: 'default',
      };
    }
    if (application.status === 'applied') {
      return {
        headline: 'Application submitted',
        description: 'Your application profile was sent to the clinic.',
        nextStep: 'The clinic is reviewing your application.',
        variant: 'info',
      };
    }
    return null;
  },
}));

import {
  formatWorkerApplicationCardLocation,
  getWorkerApplicationCardDetail,
  getWorkerApplicationCardStatusLabel,
} from '@/lib/workerApplicationCardDetail';

function makeWorkerApplication(
  overrides: Partial<WorkerApplication> & Pick<WorkerApplication, 'status' | 'post_type'>,
): WorkerApplication {
  return {
    id: 'app-1',
    worker_id: 'worker-1',
    job_post_id: overrides.post_type === 'shift' ? null : 'job-1',
    shift_post_id: overrides.post_type === 'shift' ? 'shift-1' : null,
    status: overrides.status,
    post_type: overrides.post_type,
    post_title: overrides.post_title ?? 'Dental Hygienist',
    post_role_type: overrides.post_role_type ?? 'hygienist',
    clinic_id: 'clinic-1',
    clinic_name: 'Dental Clinic',
    clinic_city: overrides.clinic_city ?? 'Bedford',
    clinic_province: overrides.clinic_province ?? 'NS',
    clinic_logo_storage_path: null,
    clinic_account_deleted: false,
    screening: null,
    created_at: '2026-08-08T12:00:00.000Z',
    updated_at: '2026-08-08T12:00:00.000Z',
    match_score: null,
    match_tier: null,
    match_breakdown: null,
    cover_message: null,
    worker_display_name: 'Candidate',
    worker_address: null,
    worker_photo_storage_path: null,
    years_of_experience: null,
    education: null,
    role_type: null,
    role_types: null,
    resume_storage_path: null,
    software_used: null,
    practice_types: null,
    preferred_employment_types: null,
    interview_at: null,
    interview_duration_minutes: null,
    interview_details: null,
    interview_proposed_at: null,
    interview_proposed_duration_minutes: null,
    interview_proposed_details: null,
    interview_proposed_by: null,
    interview_offer_closed_by: null,
    application_kit_requested_at: null,
    application_kit_submitted_at: null,
    worker_attention_at: null,
    worker_last_seen_at: null,
    clinic_attention_at: null,
    clinic_last_seen_at: null,
    status_note: null,
    status_closed_by: null,
    worker_hidden_at: null,
    clinic_hidden_at: null,
    shift_date: null,
    shift_start_time: null,
    shift_end_time: null,
    ...overrides,
  };
}

describe('getWorkerApplicationCardDetail', () => {
  it('shows worker next step for reviewed job applications', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'reviewed',
    });

    expect(getWorkerApplicationCardDetail(application)).toBe(
      'They may shortlist you or follow up with next steps.',
    );
  });

  it('shows clinic review next step for applied job applications', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'applied',
    });

    expect(getWorkerApplicationCardDetail(application)).toBe(
      'The clinic is reviewing your application.',
    );
  });

  it('shows interview datetime for scheduled interviews', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'interview_scheduled',
      interview_at: '2026-08-15T14:00:00.000Z',
      interview_duration_minutes: 60,
    });

    expect(getWorkerApplicationCardDetail(application)).toMatch(/^Interview /);
    expect(getWorkerApplicationCardDetail(application)).toContain('Aug');
  });

  it('shows kit submission CTA when the clinic requested the application profile', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'screening_submitted',
      application_kit_requested_at: '2026-08-09T12:00:00.000Z',
      application_kit_submitted_at: null,
    });

    expect(getWorkerApplicationCardDetail(application)).toBe('Submit application profile');
  });

  it('shows shift schedule for fill-in applications', () => {
    const application = makeWorkerApplication({
      post_type: 'shift',
      status: 'applied',
      shift_date: '2026-08-12',
      shift_start_time: '09:00:00',
      shift_end_time: '17:00:00',
    });

    expect(getWorkerApplicationCardDetail(application)).toContain('Aug 12');
  });
});

describe('getWorkerApplicationCardStatusLabel', () => {
  it('uses the worker status headline instead of the short badge label', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'reviewed',
    });

    expect(getWorkerApplicationCardStatusLabel(application)).toBe('Application viewed');
  });

  it('falls back to the short label when no summary headline is available', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'unknown_status' as WorkerApplication['status'],
    });

    expect(getWorkerApplicationCardStatusLabel(application)).toBe('Unknown status');
  });
});

describe('formatWorkerApplicationCardLocation', () => {
  it('joins city and province for job applications', () => {
    const application = makeWorkerApplication({
      post_type: 'job',
      status: 'applied',
      clinic_city: 'Bedford',
      clinic_province: 'NS',
    });

    expect(formatWorkerApplicationCardLocation(application)).toBe('Bedford, NS');
  });
});

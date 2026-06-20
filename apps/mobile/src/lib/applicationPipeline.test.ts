import type { ClinicApplication } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  filterApplicationsByView,
  getApplicantFilterCounts,
  getClinicApplicantBadgeVisibility,
  hasApplicantFollowUpScheduled,
} from './applicationPipeline';

function makeApplication(
  overrides: Partial<ClinicApplication> & Pick<ClinicApplication, 'id' | 'status'>,
): ClinicApplication {
  return {
    id: overrides.id,
    status: overrides.status,
    worker_id: overrides.worker_id ?? 'worker-1',
    job_post_id: overrides.job_post_id ?? 'job-1',
    shift_post_id: overrides.shift_post_id ?? null,
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
    clinic_name: null,
    clinic_city: null,
    clinic_province: null,
    clinic_logo_storage_path: null,
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
    worker_attention_at: '2026-01-01T12:00:00.000Z',
    worker_last_seen_at: null,
    clinic_attention_at: '2026-01-01T12:00:00.000Z',
    clinic_last_seen_at: null,
    worker_account_deleted_at: null,
    clinic_account_deleted_at: null,
    clinic_hidden_at: null,
    worker_hidden_at: null,
    created_at: overrides.created_at ?? '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    post_title: 'Hygienist',
    post_type: 'job',
    post_role_type: 'hygienist',
    worker_account_deleted: false,
    screening: null,
    clinic_crm: overrides.clinic_crm ?? null,
  };
}

describe('hasApplicantFollowUpScheduled', () => {
  it('returns true when clinic CRM has a follow-up date', () => {
    const application = makeApplication({
      id: 'app-1',
      status: 'applied',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-1',
        note: null,
        tags: [],
        follow_up_at: '2026-06-20T12:00:00.000Z',
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    });

    expect(hasApplicantFollowUpScheduled(application)).toBe(true);
  });
});

describe('filterApplicationsByView follow_up', () => {
  it('includes only applicants with follow-up dates and prioritizes overdue items', () => {
    const overdue = makeApplication({
      id: 'overdue',
      status: 'applied',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-1',
        note: null,
        tags: [],
        follow_up_at: '2026-06-18T12:00:00.000Z',
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    });
    const upcoming = makeApplication({
      id: 'upcoming',
      status: 'in_progress',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-2',
        note: null,
        tags: [],
        follow_up_at: '2026-06-25T12:00:00.000Z',
        created_at: '2026-01-02T12:00:00.000Z',
        updated_at: '2026-01-02T12:00:00.000Z',
      },
    });
    const none = makeApplication({ id: 'none', status: 'applied' });

    const filtered = filterApplicationsByView([upcoming, none, overdue], 'follow_up');

    expect(filtered.map((application) => application.id)).toEqual(['overdue', 'upcoming']);
    expect(getApplicantFilterCounts([upcoming, none, overdue]).follow_up).toBe(2);
  });

  it('treats blank and invalid follow-up values as unscheduled', () => {
    const valid = makeApplication({
      id: 'valid',
      status: 'applied',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-1',
        note: null,
        tags: [],
        follow_up_at: '2026-06-25T12:00:00.000Z',
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    });
    const blank = makeApplication({
      id: 'blank',
      status: 'applied',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-2',
        note: null,
        tags: [],
        follow_up_at: '   ',
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    });
    const invalid = makeApplication({
      id: 'invalid',
      status: 'applied',
      clinic_crm: {
        clinic_id: 'clinic-1',
        worker_id: 'worker-3',
        note: null,
        tags: [],
        follow_up_at: 'not-a-date',
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    });

    const applications = [invalid, valid, blank];

    expect(
      filterApplicationsByView(applications, 'follow_up').map((application) => application.id),
    ).toEqual(['valid']);
    expect(getApplicantFilterCounts(applications).follow_up).toBe(1);
    expect(hasApplicantFollowUpScheduled(blank)).toBe(false);
    expect(hasApplicantFollowUpScheduled(invalid)).toBe(false);
  });
});

describe('getClinicApplicantBadgeVisibility', () => {
  it('shows only the New highlight for unseen applied applicants', () => {
    expect(getClinicApplicantBadgeVisibility({ status: 'applied' }, true)).toEqual({
      showNewBadge: true,
      showStatusBadge: false,
    });
  });

  it('clears New badges once the applicant has been seen', () => {
    expect(getClinicApplicantBadgeVisibility({ status: 'applied' }, false)).toEqual({
      showNewBadge: false,
      showStatusBadge: true,
    });
  });

  it('keeps pipeline status badges for later stages', () => {
    expect(getClinicApplicantBadgeVisibility({ status: 'reviewed' }, false)).toEqual({
      showNewBadge: false,
      showStatusBadge: true,
    });
  });
});

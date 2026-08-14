import type { ClinicApplication } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  buildApplicationPdfPacketHtml,
  canGenerateApplicationPdfPacket,
  escapeHtml,
} from '@/lib/applicationPdfPacketContent';

function makeApplication(overrides: Partial<ClinicApplication> = {}): ClinicApplication {
  return {
    id: 'app-1',
    job_post_id: 'job-1',
    shift_post_id: null,
    worker_id: 'worker-1',
    status: 'applied',
    match_score: null,
    match_tier: 'good',
    match_breakdown: null,
    cover_message: 'Excited to join your team.',
    years_of_experience: 4,
    education: 'dental_hygiene_diploma',
    role_type: 'dental_hygienist',
    role_types: ['dental_hygienist'],
    license_type: null,
    resume_storage_path: 'resumes/worker-1/resume.pdf',
    worker_display_name: 'Alex Candidate',
    worker_address: 'Halifax, NS',
    worker_photo_storage_path: null,
    software_used: ['Dentrix'],
    practice_types: ['general'],
    preferred_employment_types: [],
    interview_at: null,
    interview_duration_minutes: null,
    interview_details: null,
    interview_proposed_at: null,
    interview_proposed_duration_minutes: null,
    interview_proposed_details: null,
    interview_proposed_by: null,
    interview_offer_closed_by: null,
    worker_hidden_at: null,
    clinic_hidden_at: null,
    clinic_name: null,
    clinic_city: null,
    clinic_province: null,
    clinic_logo_storage_path: null,
    worker_account_deleted_at: null,
    clinic_account_deleted_at: null,
    application_kit_requested_at: '2026-07-01T12:00:00.000Z',
    application_kit_submitted_at: '2026-07-02T12:00:00.000Z',
    worker_attention_at: '2026-07-01T12:00:00.000Z',
    worker_last_seen_at: null,
    clinic_attention_at: '2026-07-01T12:00:00.000Z',
    clinic_last_seen_at: null,
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-02T12:00:00.000Z',
    post_title: 'Dental Hygienist',
    post_type: 'job',
    post_role_type: 'dental_hygienist',
    worker_account_deleted: false,
    screening: null,
    clinic_crm: null,
    ...overrides,
  };
}

describe('applicationPdfPacket', () => {
  it('escapes HTML in generated content', () => {
    expect(escapeHtml('<script>&"\'</script>')).toBe(
      '&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;',
    );
  });

  it('allows packet generation only for submitted role applications', () => {
    expect(canGenerateApplicationPdfPacket(makeApplication())).toBe(true);
    expect(
      canGenerateApplicationPdfPacket(
        makeApplication({
          application_kit_submitted_at: null,
          status: 'screening_submitted',
        }),
      ),
    ).toBe(false);
    expect(canGenerateApplicationPdfPacket(makeApplication({ post_type: 'shift' }))).toBe(false);
    expect(
      canGenerateApplicationPdfPacket(makeApplication({ worker_account_deleted: true })),
    ).toBe(false);
  });

  it('builds a summary html packet with role and cover message', () => {
    const html = buildApplicationPdfPacketHtml({
      application: makeApplication(),
      clinicName: 'Harbour Dental',
    });

    expect(html).toContain('Alex Candidate');
    expect(html).toContain('Harbour Dental');
    expect(html).toContain('Dental Hygienist');
    expect(html).toContain('Excited to join your team.');
    expect(html).toContain('Attached on following pages');
    expect(html).toContain('wordmark-chair');
    expect(html).toContain('Candidate packet');
    expect(html).toContain('status-pill');
    expect(html).toContain('@page { size: letter; margin: 0.5in 0.55in 0.45in; }');
  });

  it('includes qualification response and required values in screening export', () => {
    const html = buildApplicationPdfPacketHtml({
      application: makeApplication({
        screening: {
          status: 'completed',
          createdAt: '2026-07-01T12:00:00.000Z',
          outcome: 'flagged',
          failedQuestionIds: ['years_experience_in_role'],
          answers: {
            questions: [
              {
                id: 'years_experience_in_role',
                prompt: 'How many years of experience do you have in this role?',
                type: 'number',
                answer: 2,
                knockout: { enabled: true, min: 5 },
              },
              {
                id: 'team_setting',
                prompt: 'How do you prefer to work with a team?',
                type: 'rating_1_5',
                answer: 4,
              },
            ],
          },
        },
      }),
    });

    expect(html).toContain('Qualifications');
    expect(html).toContain('Response');
    expect(html).toContain('2 years');
    expect(html).toContain('Required');
    expect(html).toContain('5+ years');
    expect(html).toContain('Culture');
    const cultureStart = html.indexOf('Culture');
    expect(cultureStart).toBeGreaterThan(-1);
    expect(html.slice(cultureStart)).not.toContain('Required');
  });
});

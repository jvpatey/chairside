import type {
  ApplicationScreening,
  ClinicApplication,
  ScreeningQuestion,
} from '@chairside/api';
import {
  DELETED_CANDIDATE_LABEL,
  formatApplicationDate,
  formatApplicationEducation,
  formatClinicApplicationStatus,
  formatRoleTypesLabel,
  formatScreeningAnswerValue,
  formatScreeningRequirementLabel,
  getRoleTypeLabel,
  getScreeningCatalogQuestion,
  getSpecialtyLabel,
  hasApplicationKitSubmitted,
  resolveWorkerRoleTypes,
} from '@chairside/config';

import { partitionScreeningAnswers, resolveScreeningKnockout } from '@/lib/screeningTriage';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.-]+/g, '_') || 'candidate';
}

function getApplicantDisplayName(
  application: Pick<ClinicApplication, 'worker_display_name' | 'worker_account_deleted'>,
): string {
  if (application.worker_account_deleted) {
    return DELETED_CANDIDATE_LABEL;
  }
  return application.worker_display_name?.trim() || 'Applicant';
}

export type ApplicationPdfPacketOptions = {
  application: ClinicApplication;
  clinicName?: string | null;
  screeningQuestions?: ScreeningQuestion[];
};

export type ApplicationPdfPacketResult = {
  uri: string;
  fileName: string;
  resumeAttached: boolean;
  resumeMergeWarning?: string;
  /** Web previews the HTML directly; PDF is built on download/print. */
  previewKind?: 'pdf' | 'html';
  sourceHtml?: string;
  exportOptions?: ApplicationPdfPacketOptions;
  /** Cached merged PDF blob URL after first export on web. */
  exportPdfUri?: string;
};

export function canGenerateApplicationPdfPacket(application: ClinicApplication): boolean {
  return (
    application.post_type === 'job' &&
    !application.worker_account_deleted &&
    hasApplicationKitSubmitted(application)
  );
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFieldRows(application: ClinicApplication): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  const applicantName = getApplicantDisplayName(application);
  rows.push({ label: 'Candidate', value: applicantName });

  if (application.worker_address?.trim()) {
    rows.push({ label: 'Location', value: application.worker_address.trim() });
  }

  rows.push({ label: 'Role', value: application.post_title });
  rows.push({
    label: 'Role type',
    value: getRoleTypeLabel(application.post_role_type),
  });

  const appliedDate = formatApplicationDate(application.created_at);
  if (appliedDate) {
    rows.push({ label: 'Applied', value: appliedDate });
  }

  rows.push({
    label: 'Status',
    value: formatClinicApplicationStatus(application.status, application.post_type),
  });

  rows.push({ label: 'Candidate packet', value: 'Submitted' });

  if (application.years_of_experience != null) {
    rows.push({
      label: 'Experience',
      value: `${application.years_of_experience} ${
        application.years_of_experience === 1 ? 'year' : 'years'
      }`,
    });
  }

  const education = formatApplicationEducation(application.education);
  if (education) {
    rows.push({ label: 'Education', value: education });
  }

  const roles = formatRoleTypesLabel(resolveWorkerRoleTypes(application));
  if (roles) {
    rows.push({ label: 'Roles', value: roles });
  }

  if ((application.software_used ?? []).length > 0) {
    rows.push({
      label: 'Software',
      value: (application.software_used ?? []).join(', '),
    });
  }

  if ((application.practice_types ?? []).length > 0) {
    rows.push({
      label: 'Practice types',
      value: (application.practice_types ?? []).map(getSpecialtyLabel).join(', '),
    });
  }

  if (application.resume_storage_path) {
    rows.push({ label: 'Resume', value: 'Attached on following pages' });
  } else {
    rows.push({ label: 'Resume', value: 'Not provided' });
  }

  return rows;
}

function buildScreeningSectionHtml(
  screening: ApplicationScreening | null,
  jobQuestions?: ScreeningQuestion[],
): string {
  if (!screening) return '';

  if (screening.status === 'skipped') {
    return `
        <h2>Screening responses</h2>
        <p class="muted">Screening skipped by applicant.</p>
    `;
  }

  const questions = screening.answers?.questions ?? [];
  if (questions.length === 0) return '';

  const { qualifications, culture } = partitionScreeningAnswers(questions);

  const renderItems = (items: typeof questions, showRequired: boolean) =>
    items
      .map((item) => {
        const catalog = getScreeningCatalogQuestion(item.id);
        const answer = formatScreeningAnswerValue(
          item.type,
          item.answer as boolean | number | string,
          catalog?.unitLabel,
        );
        const required = showRequired
          ? formatScreeningRequirementLabel(
              item.type,
              resolveScreeningKnockout(item, jobQuestions),
              catalog?.unitLabel,
            )
          : null;
        const reverseNote = item.reverseScored
          ? '<div class="muted">Lower scores are preferred for this trait.</div>'
          : '';
        const failed =
          screening.failedQuestionIds?.includes(item.id) === true
            ? '<div class="muted">Did not meet must-pass requirement.</div>'
            : '';
        const answersHtml = required
          ? `
          <div class="qa-answers">
            <div class="qa-chip">
              <div class="qa-chip-label">Response</div>
              <div class="qa-a">${escapeHtml(answer)}</div>
            </div>
            <div class="qa-chip">
              <div class="qa-chip-label">Required</div>
              <div class="qa-a">${escapeHtml(required)}</div>
            </div>
          </div>`
          : `<div class="qa-a">${escapeHtml(answer)}</div>`;
        return `
        <div class="qa">
          <div class="qa-q">${escapeHtml(item.prompt)}</div>
          ${answersHtml}
          ${failed}
          ${reverseNote}
        </div>
      `;
      })
      .join('');

  const outcomeLine =
    screening.outcome === 'pass'
      ? '<p><strong>Screening outcome:</strong> Qualified</p>'
      : screening.outcome === 'flagged'
        ? `<p><strong>Screening outcome:</strong> Needs review — did not meet: ${escapeHtml(
            (screening.failedQuestionIds ?? [])
              .map((id) => getScreeningCatalogQuestion(id)?.shortLabel ?? id)
              .join(', ') || 'must-pass requirements',
          )}</p>`
        : screening.outcome === 'incomplete'
          ? '<p><strong>Screening outcome:</strong> Incomplete</p>'
          : '';

  const qualsHtml =
    qualifications.length > 0
      ? `<h3>Qualifications</h3>${renderItems(qualifications, true)}`
      : '';
  const cultureHtml =
    culture.length > 0
      ? `<h3>Culture &amp; work style</h3>${renderItems(culture, false)}`
      : '';

  return `
      <h2>Screening responses</h2>
      ${outcomeLine}
      ${qualsHtml}
      ${cultureHtml}
  `;
}

export function buildApplicationPdfPacketHtml(options: ApplicationPdfPacketOptions): string {
  const { application, clinicName, screeningQuestions } = options;
  const applicantName = getApplicantDisplayName(application);
  const rows = buildFieldRows(application);
  const coverMessage = application.cover_message?.trim();
  const screeningHtml = buildScreeningSectionHtml(application.screening, screeningQuestions);
  const statusLabel = formatClinicApplicationStatus(application.status, application.post_type);
  const roleTypeLabel = getRoleTypeLabel(application.post_role_type);
  const appliedDate = formatApplicationDate(application.created_at);
  const generatedAt = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const detailCardsHtml = rows
    .filter((row) => !['Candidate', 'Role', 'Role type'].includes(row.label))
    .map(
      (row) => `
        <div class="detail-card">
          <div class="detail-label">${escapeHtml(row.label)}</div>
          <div class="detail-value">${escapeHtml(row.value)}</div>
        </div>
      `,
    )
    .join('');

  const coverHtml = coverMessage
    ? `
      <section class="section card">
        <h2>Cover message</h2>
        <blockquote>${escapeHtml(coverMessage)}</blockquote>
      </section>
    `
    : '';

  const clinicLine = clinicName?.trim()
    ? `<div class="clinic-name">${escapeHtml(clinicName.trim())}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: letter; margin: 0.5in 0.55in 0.45in; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        color: #0e1b2c;
        font-size: 10.5pt;
        line-height: 1.45;
        margin: 0;
        background: #ffffff;
      }
      .page { padding: 0; }
      @media screen {
        .page { padding: 0.5in 0.55in 0.45in; }
      }
      .brand-header {
        background: linear-gradient(135deg, #155eb8 0%, #1a6fd4 58%, #4a9aff 100%);
        border-radius: 14px;
        padding: 16px 18px 14px;
        color: #ffffff;
        margin-bottom: 18px;
      }
      .brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .wordmark {
        font-size: 22pt;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
        text-transform: lowercase;
      }
      .wordmark-chair { color: #ffffff; }
      .wordmark-side { color: #d6e8fa; }
      .packet-label {
        font-size: 8.5pt;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 0.92;
      }
      .clinic-name {
        margin-top: 10px;
        font-size: 11pt;
        font-weight: 600;
        opacity: 0.95;
      }
      .hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }
      .hero-main { flex: 1; min-width: 0; }
      .candidate-name {
        font-size: 24pt;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.08;
        margin: 0 0 6px;
        color: #0e1b2c;
      }
      .role-line {
        font-size: 12pt;
        font-weight: 600;
        color: #1a6fd4;
        margin-bottom: 4px;
      }
      .meta-line {
        font-size: 10pt;
        color: #5b6472;
      }
      .status-pill {
        flex-shrink: 0;
        background: #d6e8fa;
        color: #155eb8;
        border: 1px solid #b8d9f5;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .section { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
      .card {
        background: #f8fafc;
        border: 1px solid #e3eaf3;
        border-radius: 12px;
        padding: 14px 16px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      h2 {
        font-size: 9.5pt;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #5b6472;
        margin: 0 0 10px;
        font-weight: 700;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .detail-card {
        background: #ffffff;
        border: 1px solid #e3eaf3;
        border-radius: 10px;
        padding: 10px 12px;
        min-height: 58px;
      }
      .detail-label {
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7a8494;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .detail-value {
        font-size: 10.5pt;
        font-weight: 600;
        color: #0e1b2c;
        line-height: 1.35;
      }
      blockquote {
        margin: 0;
        padding: 12px 14px;
        border-left: 4px solid #1a6fd4;
        background: #ffffff;
        border-radius: 0 10px 10px 0;
        font-style: italic;
        white-space: pre-wrap;
        color: #243246;
      }
      .qa {
        background: #ffffff;
        border: 1px solid #e3eaf3;
        border-radius: 10px;
        padding: 10px 12px;
        margin-bottom: 8px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .qa-q {
        color: #5b6472;
        font-size: 9.5pt;
        margin-bottom: 6px;
        font-weight: 600;
      }
      .qa-answers {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .qa-chip {
        background: #f8fafc;
        border: 1px solid #e3eaf3;
        border-radius: 8px;
        padding: 6px 10px;
        min-width: 88px;
      }
      .qa-chip-label {
        font-size: 7.5pt;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7a8494;
        margin-bottom: 2px;
        min-height: 10px;
      }
      .qa-a {
        font-weight: 700;
        white-space: pre-wrap;
        color: #0e1b2c;
      }
      .muted {
        color: #7a8494;
        font-size: 9pt;
        font-style: italic;
        margin-top: 4px;
      }
      .footer {
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid #e3eaf3;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #7a8494;
        font-size: 8.5pt;
      }
      .footer-brand {
        font-weight: 700;
        color: #1a6fd4;
        text-transform: lowercase;
        letter-spacing: -0.02em;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="brand-header">
        <div class="brand-row">
          <div class="wordmark">
            <span class="wordmark-chair">chair</span><span class="wordmark-side">side</span>
          </div>
          <div class="packet-label">Candidate packet</div>
        </div>
        ${clinicLine}
      </header>

      <section class="hero">
        <div class="hero-main">
          <h1 class="candidate-name">${escapeHtml(applicantName)}</h1>
          <div class="role-line">${escapeHtml(application.post_title)} · ${escapeHtml(roleTypeLabel)}</div>
          <div class="meta-line">${appliedDate ? `Applied ${escapeHtml(appliedDate)}` : 'Application summary'} · Generated ${escapeHtml(generatedAt)}</div>
        </div>
        <div class="status-pill">${escapeHtml(statusLabel)}</div>
      </section>

      <section class="section card">
        <h2>Application details</h2>
        <div class="detail-grid">${detailCardsHtml}</div>
      </section>

      ${coverHtml}
      ${screeningHtml ? `<section class="section card">${screeningHtml}</section>` : ''}

      <div class="footer">
        <span>Confidential · For internal clinic review only</span>
        <span class="footer-brand">chairside</span>
      </div>
    </div>
  </body>
</html>`;
}

export function buildApplicationPdfPacketFileName(application: ClinicApplication): string {
  const applicantName = getApplicantDisplayName(application);
  const base = applicantName.trim() || application.post_title.trim() || 'candidate';
  return `${sanitizeFileName(base)}-application-packet.pdf`;
}

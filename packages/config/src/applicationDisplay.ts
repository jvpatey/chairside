import { formatStoredEducation } from './clinicOptions';

export type ApplicationPostType = 'job' | 'shift';

/** Shown when a counterpart account has been deleted but history is retained. */
export const DELETED_ACCOUNT_LABEL = 'No longer on Chairside';
export const DELETED_CANDIDATE_LABEL = 'Candidate no longer on Chairside';
export const DELETED_CLINIC_LABEL = 'Clinic no longer on Chairside';
export const DELETED_MESSAGE_BODY = '[Message removed]';

const JOB_STATUS_LABELS: Record<string, string> = {
  screening_submitted: 'Screening submitted',
  applied: 'Applied',
  reviewed: 'Viewed',
  in_progress: 'Shortlisted',
  interview_offered: 'Interview invitation',
  interview_scheduled: 'Interview confirmed',
  selected: 'Hired',
  rejected: 'Declined',
  hired: 'Hired',
  shortlisted: 'Shortlisted',
};

const SHIFT_STATUS_LABELS: Record<string, string> = {
  applied: 'Requested',
  reviewed: 'Viewed',
  in_progress: 'In progress',
  interview_offered: 'Interview invitation',
  interview_scheduled: 'Interview scheduled',
  selected: 'Confirmed',
  rejected: 'Declined',
  hired: 'Confirmed',
  shortlisted: 'In progress',
};

const CLINIC_STATUS_LABELS: Record<string, string> = {
  screening_submitted: 'Screening',
  applied: 'Applied',
  reviewed: 'Viewed',
  in_progress: 'Shortlisted',
  interview_offered: 'Awaiting response',
  interview_scheduled: 'Interview set',
  selected: 'Hired',
  rejected: 'Not moving forward',
  hired: 'Hired',
  shortlisted: 'Shortlisted',
};

/** Clinic-facing labels for fill-in (shift) applications. */
const CLINIC_SHIFT_STATUS_LABELS: Record<string, string> = {
  applied: 'Requested',
  reviewed: 'Viewed',
  in_progress: 'In progress',
  interview_offered: 'Awaiting response',
  interview_scheduled: 'Interview set',
  selected: 'Confirmed',
  rejected: 'Not moving forward',
  hired: 'Confirmed',
  shortlisted: 'In progress',
};

export function formatApplicationStatus(
  status: string | null | undefined,
  postType?: ApplicationPostType,
): string {
  if (!status) return 'Unknown';
  const labels = postType === 'shift' ? SHIFT_STATUS_LABELS : JOB_STATUS_LABELS;
  return labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/** Worker-facing fill-in status, including confirmed cancellations and removals. */
export function formatWorkerShiftApplicationStatus(input: {
  status: string | null | undefined;
  status_note?: string | null;
  status_closed_by?: string | null;
}): string {
  const { status, status_closed_by } = input;
  if (status === 'rejected' && status_closed_by === 'clinic_deleted') {
    return 'Removed';
  }
  if (status === 'rejected' && status_closed_by) {
    return 'Cancelled';
  }
  return formatApplicationStatus(status, 'shift');
}

/** Clinic-facing fill-in status, including confirmed cancellations and removals. */
export function formatClinicShiftApplicationStatus(input: {
  status: string | null | undefined;
  status_closed_by?: string | null;
}): string {
  const { status, status_closed_by } = input;
  if (status === 'rejected' && status_closed_by === 'clinic_deleted') {
    return 'Removed';
  }
  if (status === 'rejected' && status_closed_by) {
    return 'Cancelled';
  }
  return formatClinicApplicationStatus(status, 'shift');
}

/** Clinic-facing labels for role and fill-in application pipeline. */
export function formatClinicApplicationStatus(
  status: string | null | undefined,
  postType?: ApplicationPostType,
): string {
  if (!status) return 'Unknown';
  const labels = postType === 'shift' ? CLINIC_SHIFT_STATUS_LABELS : CLINIC_STATUS_LABELS;
  return labels[status] ?? formatApplicationStatus(status, postType ?? 'job');
}

export function formatJobApplicationSummaryMeta(summary: {
  applicant_count: number;
  screening_count?: number;
  pending_count: number;
  unseen_count?: number;
  shortlisted_count?: number;
  interview_count?: number;
}): string | undefined {
  if (summary.applicant_count === 0) return undefined;

  const parts: string[] = [];
  const unseenCount = summary.unseen_count ?? summary.pending_count;

  if ((summary.screening_count ?? 0) > 0) {
    const count = summary.screening_count ?? 0;
    parts.push(count === 1 ? '1 screening' : `${count} screening`);
  }
  if (unseenCount > 0) {
    parts.push(unseenCount === 1 ? '1 new' : `${unseenCount} new`);
  }
  if ((summary.shortlisted_count ?? 0) > 0) {
    const count = summary.shortlisted_count ?? 0;
    parts.push(count === 1 ? '1 shortlisted' : `${count} shortlisted`);
  }
  if ((summary.interview_count ?? 0) > 0) {
    const count = summary.interview_count ?? 0;
    parts.push(count === 1 ? '1 interview' : `${count} interview`);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  return undefined;
}

/** Subtitle for a single role's applicant list header. */
export function formatRoleApplicantPipelineSubtitle(applications: {
  status: string;
}[]): string | undefined {
  if (applications.length === 0) return undefined;

  const screeningCount = applications.filter(
    (application) => application.status === 'screening_submitted',
  ).length;
  const newCount = applications.filter(
    (application) => application.status === 'applied' || application.status === 'reviewed',
  ).length;
  const shortlistedCount = applications.filter(
    (application) => application.status === 'in_progress',
  ).length;
  const interviewCount = applications.filter(
    (application) =>
      application.status === 'interview_offered' ||
      application.status === 'interview_scheduled',
  ).length;

  const parts: string[] = [];
  if (screeningCount > 0) {
    parts.push(screeningCount === 1 ? '1 screening' : `${screeningCount} screening`);
  }
  if (newCount > 0) {
    parts.push(newCount === 1 ? '1 to review' : `${newCount} to review`);
  }
  if (shortlistedCount > 0) {
    parts.push(shortlistedCount === 1 ? '1 shortlisted' : `${shortlistedCount} shortlisted`);
  }
  if (interviewCount > 0) {
    parts.push(interviewCount === 1 ? '1 interview' : `${interviewCount} interview`);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  const total = applications.length;
  return total === 1 ? '1 applicant' : `${total} applicants`;
}

export function isActiveApplicationStatus(status: string | null | undefined): boolean {
  return (
    status === 'screening_submitted' ||
    status === 'applied' ||
    status === 'reviewed' ||
    status === 'in_progress' ||
    status === 'interview_offered' ||
    status === 'interview_scheduled'
  );
}

export function isScreeningStageStatus(status: string | null | undefined): boolean {
  return status === 'screening_submitted';
}

export function hasApplicationKitSubmitted(application: {
  application_kit_submitted_at?: string | null;
  status?: string | null;
}): boolean {
  if (application.application_kit_submitted_at) return true;
  return (
    application.status === 'applied' ||
    application.status === 'reviewed' ||
    application.status === 'in_progress' ||
    application.status === 'shortlisted' ||
    application.status === 'interview_offered' ||
    application.status === 'interview_scheduled' ||
    application.status === 'selected' ||
    application.status === 'hired'
  );
}

export function isAwaitingApplicationKit(application: {
  application_kit_requested_at?: string | null;
  application_kit_submitted_at?: string | null;
  status?: string | null;
}): boolean {
  return (
    application.status === 'screening_submitted' &&
    Boolean(application.application_kit_requested_at) &&
    !application.application_kit_submitted_at
  );
}

export function formatClinicScreeningStatus(application: {
  application_kit_requested_at?: string | null;
  application_kit_submitted_at?: string | null;
  status?: string | null;
  post_type?: ApplicationPostType;
}): string {
  if (application.status !== 'screening_submitted') {
    return formatClinicApplicationStatus(application.status, application.post_type);
  }
  if (isAwaitingApplicationKit(application)) {
    return 'Awaiting candidate packet';
  }
  return 'Screening';
}

export function isTerminalApplicationStatus(status: string | null | undefined): boolean {
  return status === 'rejected' || status === 'selected' || status === 'hired';
}

export function canWorkerHideApplication(input: {
  status: string;
  worker_hidden_at?: string | null;
  post_status?: string | null;
}): boolean {
  if (input.worker_hidden_at) return false;
  if (isTerminalApplicationStatus(input.status)) return true;
  return input.post_status === 'filled' || input.post_status === 'closed';
}

export function isDecidedApplicationStatus(status: string | null | undefined): boolean {
  return status === 'rejected' || status === 'selected' || status === 'hired';
}

export function canClinicHideApplication(input: {
  status: string;
  clinic_hidden_at?: string | null;
}): boolean {
  if (input.clinic_hidden_at) return false;
  return isDecidedApplicationStatus(input.status);
}

export function formatApplicationResumeStatus(
  resumeStoragePath: string | null | undefined,
): string {
  return resumeStoragePath?.trim() ? 'Included' : 'Not included';
}

export function formatApplicationDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatApplicationScreeningStatus(
  status: 'completed' | 'skipped' | null | undefined,
): string | null {
  if (!status) return null;
  return status === 'completed' ? 'Completed' : 'Skipped';
}

/** Format education text stored on application snapshots. */
export function formatApplicationEducation(value: string | null | undefined): string {
  return formatStoredEducation(value);
}

/** Format interview date/time for display. */
export function formatInterviewDateTime(
  interviewAt: string | null | undefined,
  durationMinutes?: number | null,
): string | null {
  if (!interviewAt) return null;

  const start = new Date(interviewAt);
  if (Number.isNaN(start.getTime())) return null;

  const datePart = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (durationMinutes && durationMinutes > 0) {
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const endTimePart = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} · ${timePart} – ${endTimePart}`;
  }

  return `${datePart} · ${timePart}`;
}

export function hasPendingInterviewProposal(application: {
  interview_proposed_at?: string | null;
}): boolean {
  return Boolean(application.interview_proposed_at?.trim());
}

/** Split stored interview details into location and free-text notes. */
export function parseInterviewDetailsBlob(value: string | null | undefined): {
  location: string | null;
  notes: string | null;
} {
  if (!value?.trim()) {
    return { location: null, notes: null };
  }

  const parts = value.split('\n\n');
  if (parts.length >= 2) {
    const location = parts[0]?.trim() || null;
    const notes = parts.slice(1).join('\n\n').trim() || null;
    return { location, notes };
  }

  return { location: value.trim(), notes: null };
}

export function formatInterviewDetailsBlob(location: string, notes: string): string | null {
  return [location.trim(), notes.trim()].filter(Boolean).join('\n\n') || null;
}

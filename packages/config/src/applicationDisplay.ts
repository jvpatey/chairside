import { formatStoredEducation } from './clinicOptions';

export type ApplicationPostType = 'job' | 'shift';

const JOB_STATUS_LABELS: Record<string, string> = {
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
  applied: 'New',
  reviewed: 'Viewed',
  in_progress: 'Shortlisted',
  interview_offered: 'Awaiting response',
  interview_scheduled: 'Interview set',
  selected: 'Hired',
  rejected: 'Not moving forward',
  hired: 'Hired',
  shortlisted: 'Shortlisted',
};

export function formatApplicationStatus(
  status: string | null | undefined,
  postType?: ApplicationPostType,
): string {
  if (!status) return 'Unknown';
  const labels = postType === 'shift' ? SHIFT_STATUS_LABELS : JOB_STATUS_LABELS;
  return labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/** Clinic-facing labels for role application pipeline. */
export function formatClinicApplicationStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  return CLINIC_STATUS_LABELS[status] ?? formatApplicationStatus(status, 'job');
}

export function formatJobApplicationSummaryMeta(summary: {
  applicant_count: number;
  pending_count: number;
  shortlisted_count?: number;
  interview_count?: number;
}): string | undefined {
  if (summary.applicant_count === 0) return undefined;

  const parts: string[] = [];

  if (summary.pending_count > 0) {
    parts.push(summary.pending_count === 1 ? '1 new' : `${summary.pending_count} new`);
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

  const viewedCount = summary.applicant_count - summary.pending_count;
  if (viewedCount > 0) {
    return viewedCount === 1 ? '1 viewed' : `${viewedCount} viewed`;
  }

  return undefined;
}

/** Subtitle for a single role's applicant list header. */
export function formatRoleApplicantPipelineSubtitle(applications: {
  status: string;
}[]): string | undefined {
  if (applications.length === 0) return undefined;

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
    status === 'applied' ||
    status === 'reviewed' ||
    status === 'in_progress' ||
    status === 'interview_offered' ||
    status === 'interview_scheduled'
  );
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
  return status === 'completed' ? 'Completed' : 'Incomplete';
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

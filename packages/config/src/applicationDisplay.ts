import { formatStoredEducation } from './clinicOptions';

export type ApplicationPostType = 'job' | 'shift';

const JOB_STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  reviewed: 'Viewed',
  in_progress: 'In progress',
  selected: 'Selected',
  rejected: 'Declined',
  hired: 'Selected',
  shortlisted: 'In progress',
};

const SHIFT_STATUS_LABELS: Record<string, string> = {
  applied: 'Requested',
  reviewed: 'Viewed',
  in_progress: 'In progress',
  selected: 'Confirmed',
  rejected: 'Declined',
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

/** Clinic-facing labels — unreviewed applications show as "New". */
export function formatClinicApplicationStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  if (status === 'applied') return 'New';
  if (status === 'reviewed') return 'Viewed';
  return formatApplicationStatus(status, 'job');
}

export function formatJobApplicationSummaryMeta(summary: {
  applicant_count: number;
  pending_count: number;
}): string | undefined {
  if (summary.applicant_count === 0) return undefined;

  const viewedCount = summary.applicant_count - summary.pending_count;
  const parts: string[] = [];

  if (summary.pending_count > 0) {
    parts.push(summary.pending_count === 1 ? '1 new' : `${summary.pending_count} new`);
  }
  if (viewedCount > 0) {
    parts.push(viewedCount === 1 ? '1 viewed' : `${viewedCount} viewed`);
  }

  return parts.join(' · ');
}

export function isActiveApplicationStatus(status: string | null | undefined): boolean {
  return status === 'applied' || status === 'reviewed' || status === 'in_progress';
}

export function formatApplicationResumeStatus(
  resumeStoragePath: string | null | undefined,
): string {
  return resumeStoragePath?.trim() ? 'Included' : 'Not included';
}

/** Format education text stored on application snapshots. */
export function formatApplicationEducation(value: string | null | undefined): string {
  return formatStoredEducation(value);
}

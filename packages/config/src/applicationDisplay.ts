import { formatStoredEducation } from './clinicOptions';

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  reviewed: 'Viewed',
  rejected: 'Rejected',
  hired: 'Hired',
  shortlisted: 'Applied',
};

export function formatApplicationStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  return APPLICATION_STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
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

import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';

import { formatPostedDateLabel } from '@/lib/dates';

export type ClinicPostingTableColumn = {
  key: string;
  label: string;
  width: string;
};

export const CLINIC_ROLE_TABLE_COLUMNS: readonly ClinicPostingTableColumn[] = [
  // Only Role flexes; other columns hug content so wide layouts stay dense.
  { key: 'role', label: 'Role', width: 'minmax(200px, 1fr)' },
  { key: 'type', label: 'Type', width: 'max-content' },
  { key: 'status', label: 'Status', width: 'max-content' },
  { key: 'location', label: 'Location', width: 'max-content' },
  { key: 'applicants', label: 'Applicants', width: 'max-content' },
  { key: 'posted', label: 'Posted', width: 'max-content' },
  { key: 'pay', label: 'Pay', width: 'max-content' },
  { key: 'actions', label: '', width: '40px' },
];

export function clinicPostingTableGridTemplate(
  columns: readonly ClinicPostingTableColumn[],
): string {
  return columns.map((column) => column.width).join(' ');
}

export function formatClinicPostingLocation(
  locationName?: string | null,
  city?: string | null,
  province?: string | null,
): string {
  const place = [city, province].filter(Boolean).join(', ');
  return [locationName, place].filter(Boolean).join(' · ');
}

export function formatClinicPostingPostedDate(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '—';
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatClinicApplicantCount(count: number): string {
  return count === 1 ? '1 applicant' : `${count} applicants`;
}

export function formatClinicRoleCompactMeta(
  job: Pick<JobPost, 'role_type' | 'employment_type' | 'created_at'>,
  applicantCount: number,
): string {
  return [formatJobPostRoleMeta(job), formatClinicApplicantCount(applicantCount), formatPostedDateLabel(job.created_at)]
    .filter(Boolean)
    .join(' · ');
}

import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';

import { formatPostedDateLabel } from '@/lib/dates';

export type ClinicPostingTableColumn = {
  key: string;
  label: string;
  width: string;
};

export const CLINIC_ROLE_TABLE_COLUMNS: readonly ClinicPostingTableColumn[] = [
  { key: 'role', label: 'Role', width: 'minmax(140px, 2.2fr)' },
  { key: 'type', label: 'Type', width: 'minmax(88px, 1fr)' },
  { key: 'status', label: 'Status', width: 'minmax(80px, 0.8fr)' },
  { key: 'location', label: 'Location', width: 'minmax(100px, 1.2fr)' },
  { key: 'applicants', label: 'Applicants', width: 'minmax(96px, 0.9fr)' },
  { key: 'posted', label: 'Posted', width: 'minmax(90px, 0.9fr)' },
  { key: 'pay', label: 'Pay', width: 'minmax(72px, 0.9fr)' },
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

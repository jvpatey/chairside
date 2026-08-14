import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';

import { formatPostedDateLabel } from '@/lib/dates';

export type ClinicPostingTableColumn = {
  key: string;
  label: string;
  width: string;
};

export const CLINIC_ROLE_TABLE_COLUMNS: readonly ClinicPostingTableColumn[] = [
  // Role absorbs leftover width; compact columns stay near content size.
  { key: 'role', label: 'Role', width: 'minmax(180px, 1.6fr)' },
  { key: 'type', label: 'Type', width: 'minmax(150px, 1fr)' },
  { key: 'status', label: 'Status', width: '72px' },
  { key: 'location', label: 'Location', width: 'minmax(130px, 1.1fr)' },
  { key: 'applicants', label: 'Applicants', width: '88px' },
  { key: 'posted', label: 'Posted', width: '104px' },
  { key: 'pay', label: 'Pay', width: 'minmax(80px, 0.7fr)' },
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

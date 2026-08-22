import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';

import { formatPostedDateLabel } from '@/lib/dates';

export type ClinicPostingTableColumnKey =
  | 'role'
  | 'status'
  | 'location'
  | 'applicants'
  | 'posted'
  | 'pay'
  | 'actions';

export type ClinicPostingTableColumn = {
  key: ClinicPostingTableColumnKey;
  label: string;
  width: string;
  align?: 'start' | 'end';
};

export function getClinicRoleTableColumns(
  showLocation = false,
): readonly ClinicPostingTableColumn[] {
  return [
    { key: 'role', label: 'Role', width: 'minmax(240px, 2.4fr)', align: 'start' },
    { key: 'status', label: 'Status', width: '104px', align: 'start' },
    ...(showLocation
      ? ([
          {
            key: 'location',
            label: 'Location',
            width: 'minmax(128px, 1.1fr)',
            align: 'start',
          },
        ] as const)
      : []),
    { key: 'applicants', label: 'Applicants', width: '148px', align: 'start' },
    { key: 'posted', label: 'Posted', width: '96px', align: 'end' },
    { key: 'pay', label: 'Pay', width: 'minmax(92px, 0.9fr)', align: 'end' },
    { key: 'actions', label: '', width: '44px', align: 'end' },
  ];
}

export const CLINIC_ROLE_TABLE_COLUMNS = getClinicRoleTableColumns(true);

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

export type ClinicJobLocationRecord = {
  id: string;
  name?: string | null;
  city?: string | null;
  province?: string | null;
};

export function resolveClinicJobLocationLabel(
  job: Pick<JobPost, 'location_id'>,
  locations: readonly ClinicJobLocationRecord[],
  clinicProfile?: { city?: string | null; province?: string | null } | null,
): string {
  const locationRecord = locations.find((location) => location.id === job.location_id);
  return formatClinicPostingLocation(
    locationRecord?.name,
    locationRecord?.city ?? clinicProfile?.city,
    locationRecord?.province ?? clinicProfile?.province,
  );
}

export function formatClinicPostingTableLocation(
  locationName?: string | null,
  city?: string | null,
): string {
  return locationName?.trim() || city?.trim() || '—';
}

export function formatClinicPostingPostedDate(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '—';
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '—';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
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

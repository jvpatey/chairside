import type {
  ClinicApplication,
  FillInCoverRequest,
  FillInOutreachWorker,
  JobApplicationSummary,
  JobPost,
  ShiftPost,
} from '@chairside/api';
import {
  formatApplicationStatus,
  formatClinicApplicationStatus,
  getRoleTypeLabel,
} from '@chairside/config';

import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';

export function normalizeListSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesListSearchText(haystack: string | null | undefined, query: string): boolean {
  const normalized = normalizeListSearchQuery(query);
  if (!normalized) return true;
  if (!haystack?.trim()) return false;
  return haystack.toLowerCase().includes(normalized);
}

function matchesAnyListSearchText(values: Array<string | null | undefined>, query: string): boolean {
  const normalized = normalizeListSearchQuery(query);
  if (!normalized) return true;
  return values.some((value) => matchesListSearchText(value, normalized));
}

export function matchesJobPostSearch(job: JobPost, query: string): boolean {
  return matchesAnyListSearchText(
    [
      job.title,
      getRoleTypeLabel(job.role_type),
      job.status,
      job.description,
      job.wage_range,
      job.schedule,
    ],
    query,
  );
}

export function matchesJobApplicationSummarySearch(
  summary: JobApplicationSummary,
  query: string,
): boolean {
  return matchesAnyListSearchText([summary.post_title], query);
}

export type ClinicApplicationSummaryFilter = 'all' | 'needs_attention';

export const CLINIC_APPLICATION_SUMMARY_FILTER_OPTIONS: {
  value: ClinicApplicationSummaryFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All roles' },
  { value: 'needs_attention', label: 'Needs attention' },
];

export function matchesClinicApplicationSummaryFilter(
  summary: JobApplicationSummary,
  filter: ClinicApplicationSummaryFilter,
): boolean {
  if (filter === 'all') return true;
  return summary.unseen_count > 0;
}

export function matchesClinicApplicationSearch(
  application: ClinicApplication | FillInCoverRequest,
  query: string,
): boolean {
  const statusLabel =
    application.post_type === 'shift'
      ? formatApplicationStatus(application.status, 'shift')
      : formatClinicApplicationStatus(application.status);

  return matchesAnyListSearchText(
    [
      application.worker_display_name,
      application.post_title,
      getRoleTypeLabel(application.post_role_type),
      statusLabel,
      application.cover_message,
      'shift_date' in application ? application.shift_date : null,
    ],
    query,
  );
}

export function matchesShiftPostSearch(shift: ShiftPost, query: string): boolean {
  return matchesAnyListSearchText(
    [
      getRoleTypeLabel(shift.role_type),
      shift.shift_date,
      formatShiftPostMeta(shift),
      shift.status,
      shift.description,
      shift.compensation,
    ],
    query,
  );
}

export function matchesFillInOutreachWorkerSearch(
  worker: FillInOutreachWorker,
  query: string,
): boolean {
  return matchesAnyListSearchText(
    [
      worker.displayName,
      worker.city,
      worker.availabilitySummary,
      ...worker.roleTypes.map((roleType) => getRoleTypeLabel(roleType)),
    ],
    query,
  );
}

export function hasActiveListSearch(query: string): boolean {
  return normalizeListSearchQuery(query).length > 0;
}

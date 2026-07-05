import type { ShiftPost, WorkerApplication } from '@chairside/api';

import { parseISODate, startOfDay, todayISO } from '@/lib/dates';
import type { RoleTypeFilter, ShiftDateFilter, ShiftStatusFilter } from '@/lib/postingFilters';
import { filterShiftPosts } from '@/lib/postingFilters';

export type FillInsListMode = 'active' | 'history';

const IN_PROGRESS_STATUSES = ['applied', 'reviewed', 'in_progress'] as const;

function isCancelledShiftApplication(application: WorkerApplication): boolean {
  return application.status === 'rejected' && Boolean(application.status_closed_by);
}

function isDeclinedShiftApplication(application: WorkerApplication): boolean {
  return application.status === 'rejected' && !application.status_closed_by;
}

export function isTodayOrUpcomingShiftDate(shiftDate: string | null | undefined): boolean {
  if (!shiftDate) return false;
  return shiftDate >= todayISO();
}

export function isPastShiftDate(shiftDate: string | null | undefined): boolean {
  if (!shiftDate) return false;
  const parsed = parseISODate(shiftDate);
  if (!parsed) return false;
  return parsed.getTime() < startOfDay(new Date()).getTime();
}

export function isExpiredLiveShift(shift: Pick<ShiftPost, 'status' | 'shift_date'>): boolean {
  return shift.status === 'live' && isPastShiftDate(shift.shift_date);
}

function compareShiftApplicationsByDateAsc(a: WorkerApplication, b: WorkerApplication): number {
  const dateCompare = (a.shift_date ?? '').localeCompare(b.shift_date ?? '');
  if (dateCompare !== 0) return dateCompare;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function compareShiftApplicationsByDateDesc(a: WorkerApplication, b: WorkerApplication): number {
  const dateCompare = (b.shift_date ?? '').localeCompare(a.shift_date ?? '');
  if (dateCompare !== 0) return dateCompare;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function partitionWorkerShiftApplications(applications: WorkerApplication[]) {
  const upcomingConfirmed = applications
    .filter((application) => application.status === 'hired' && isTodayOrUpcomingShiftDate(application.shift_date))
    .sort(compareShiftApplicationsByDateAsc);

  const pastConfirmed = applications
    .filter((application) => application.status === 'hired' && isPastShiftDate(application.shift_date))
    .sort(compareShiftApplicationsByDateDesc);

  const upcomingInProgress = applications
    .filter(
      (application) =>
        IN_PROGRESS_STATUSES.includes(application.status as (typeof IN_PROGRESS_STATUSES)[number]) &&
        isTodayOrUpcomingShiftDate(application.shift_date),
    )
    .sort(compareShiftApplicationsByDateAsc);

  const cancelledApplications = applications
    .filter(isCancelledShiftApplication)
    .sort(compareShiftApplicationsByDateDesc);

  const declinedApplications = applications
    .filter(isDeclinedShiftApplication)
    .sort(compareShiftApplicationsByDateDesc);

  const upcomingCancelled = cancelledApplications.filter((application) =>
    isTodayOrUpcomingShiftDate(application.shift_date),
  );

  const pastCancelled = cancelledApplications.filter((application) =>
    isPastShiftDate(application.shift_date),
  );

  const pastInProgress = applications
    .filter(
      (application) =>
        IN_PROGRESS_STATUSES.includes(application.status as (typeof IN_PROGRESS_STATUSES)[number]) &&
        isPastShiftDate(application.shift_date),
    )
    .sort(compareShiftApplicationsByDateDesc);

  return {
    upcomingConfirmed,
    pastConfirmed,
    upcomingInProgress,
    upcomingCancelled,
    pastInProgress,
    pastCancelled,
    cancelledApplications,
    declinedApplications,
  };
}

export function isHistoryShift(shift: ShiftPost): boolean {
  return (
    isPastShiftDate(shift.shift_date) ||
    shift.status === 'filled' ||
    shift.status === 'closed' ||
    shift.status === 'draft'
  );
}

export function filterShiftPostsForFillInsListMode(
  shifts: ShiftPost[],
  mode: FillInsListMode,
  statusFilter: ShiftStatusFilter,
  roleTypeFilter: RoleTypeFilter,
  dateFilter: ShiftDateFilter,
): ShiftPost[] {
  if (mode === 'active') {
    return filterShiftPosts(shifts, 'open', roleTypeFilter, 'all').filter((shift) =>
      isTodayOrUpcomingShiftDate(shift.shift_date),
    );
  }

  return filterShiftPosts(shifts, statusFilter, roleTypeFilter, dateFilter)
    .filter(isHistoryShift)
    .sort((a, b) => {
      const dateCompare = b.shift_date.localeCompare(a.shift_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });
}

/** Open, today-or-upcoming fill-ins — excludes history. */
export function countActiveFillIns(shifts: ShiftPost[]): number {
  return filterShiftPostsForFillInsListMode(shifts, 'active', 'open', 'all', 'all').length;
}

export const FILL_INS_LIST_MODE_OPTIONS: { value: FillInsListMode; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'history', label: 'History' },
];

export type FillInsTabMode = 'open' | 'confirmed' | 'history' | 'availability';

export const FILL_INS_TAB_MODE_OPTIONS: { value: FillInsTabMode; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'history', label: 'History' },
  { value: 'availability', label: 'Availability' },
];

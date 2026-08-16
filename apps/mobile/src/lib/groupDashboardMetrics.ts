import { isDecidedApplicationStatus } from '@chairside/config';

export type LocationGlanceSource = {
  id: string;
  name: string;
  city: string | null;
  province?: string | null;
  logo_storage_path: string | null;
};

export type LocationPostSource = {
  id: string;
  location_id?: string | null;
  status: string;
};

export type LocationShiftSource = LocationPostSource & {
  shift_date: string;
};

export type LocationApplicationSource = {
  id: string;
  status: string;
  job_post_id: string | null;
  shift_post_id: string | null;
};

export type LocationGlanceRow = {
  locationId: string;
  name: string;
  city: string | null;
  province: string | null;
  logoStoragePath: string | null;
  openFillIns: number;
  openRoles: number;
  pendingApplications: number;
};

export type WeekCoverageRow = {
  locationId: string;
  name: string;
  city: string | null;
  logoStoragePath: string | null;
  unfilledCount: number;
  nearestShiftDate: string | null;
};

function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Exclusive end date for a 7-day window starting at `today` (YYYY-MM-DD). */
export function addDaysIso(today: string, days: number): string {
  const date = new Date(`${today}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isOpenFillIn(shift: LocationShiftSource, today: string): boolean {
  return shift.status === 'live' && shift.shift_date >= today;
}

function isOpenRole(job: LocationPostSource): boolean {
  return job.status === 'live';
}

function buildPostLocationMap(
  jobs: LocationPostSource[],
  shifts: LocationShiftSource[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const job of jobs) {
    if (job.location_id) map.set(`job:${job.id}`, job.location_id);
  }
  for (const shift of shifts) {
    if (shift.location_id) map.set(`shift:${shift.id}`, shift.location_id);
  }
  return map;
}

export function buildLocationGlanceRows(input: {
  locations: LocationGlanceSource[];
  jobs: LocationPostSource[];
  shifts: LocationShiftSource[];
  applications: LocationApplicationSource[];
  today?: string;
}): LocationGlanceRow[] {
  const today = input.today ?? todayIsoDate();
  const postLocationMap = buildPostLocationMap(input.jobs, input.shifts);

  const fillInsByLocation = new Map<string, number>();
  const rolesByLocation = new Map<string, number>();
  const appsByLocation = new Map<string, number>();

  for (const shift of input.shifts) {
    if (!shift.location_id || !isOpenFillIn(shift, today)) continue;
    fillInsByLocation.set(
      shift.location_id,
      (fillInsByLocation.get(shift.location_id) ?? 0) + 1,
    );
  }

  for (const job of input.jobs) {
    if (!job.location_id || !isOpenRole(job)) continue;
    rolesByLocation.set(job.location_id, (rolesByLocation.get(job.location_id) ?? 0) + 1);
  }

  for (const application of input.applications) {
    if (isDecidedApplicationStatus(application.status as never)) continue;
    const locationId = application.job_post_id
      ? postLocationMap.get(`job:${application.job_post_id}`)
      : application.shift_post_id
        ? postLocationMap.get(`shift:${application.shift_post_id}`)
        : undefined;
    if (!locationId) continue;
    appsByLocation.set(locationId, (appsByLocation.get(locationId) ?? 0) + 1);
  }

  return input.locations.map((location) => ({
    locationId: location.id,
    name: location.name,
    city: location.city,
    province: location.province ?? null,
    logoStoragePath: location.logo_storage_path,
    openFillIns: fillInsByLocation.get(location.id) ?? 0,
    openRoles: rolesByLocation.get(location.id) ?? 0,
    pendingApplications: appsByLocation.get(location.id) ?? 0,
  }));
}

export function buildWeekCoverageRows(input: {
  locations: LocationGlanceSource[];
  shifts: LocationShiftSource[];
  today?: string;
  /** When set, only include this location (single-scope view). */
  locationIdFilter?: string | null;
  /**
   * Assign shifts with a null `location_id` to this id (single-clinic practices
   * that post without a location row).
   */
  fallbackLocationId?: string | null;
}): WeekCoverageRow[] {
  const today = input.today ?? todayIsoDate();
  const endExclusive = addDaysIso(today, 7);
  const locations = input.locationIdFilter
    ? input.locations.filter((location) => location.id === input.locationIdFilter)
    : input.locations;

  const counts = new Map<string, { count: number; nearest: string | null }>();

  for (const shift of input.shifts) {
    if (shift.status !== 'live') continue;
    if (shift.shift_date < today || shift.shift_date >= endExclusive) continue;

    const locationId = shift.location_id ?? input.fallbackLocationId ?? null;
    if (!locationId) continue;
    if (input.locationIdFilter && locationId !== input.locationIdFilter) continue;

    const current = counts.get(locationId) ?? { count: 0, nearest: null };
    current.count += 1;
    if (!current.nearest || shift.shift_date < current.nearest) {
      current.nearest = shift.shift_date;
    }
    counts.set(locationId, current);
  }

  return locations
    .map((location) => {
      const entry = counts.get(location.id);
      return {
        locationId: location.id,
        name: location.name,
        city: location.city,
        logoStoragePath: location.logo_storage_path,
        unfilledCount: entry?.count ?? 0,
        nearestShiftDate: entry?.nearest ?? null,
      };
    })
    .filter((row) => row.unfilledCount > 0)
    .sort((a, b) => {
      const dateCompare = (a.nearestShiftDate ?? '').localeCompare(b.nearestShiftDate ?? '');
      if (dateCompare !== 0) return dateCompare;
      return b.unfilledCount - a.unfilledCount;
    });
}

export function formatLocationGlanceCounts(row: LocationGlanceRow): string {
  const parts: string[] = [];
  if (row.openFillIns > 0) {
    parts.push(`${row.openFillIns} fill-in${row.openFillIns === 1 ? '' : 's'}`);
  }
  if (row.openRoles > 0) {
    parts.push(`${row.openRoles} role${row.openRoles === 1 ? '' : 's'}`);
  }
  if (row.pendingApplications > 0) {
    parts.push(`${row.pendingApplications} app${row.pendingApplications === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'No open activity';
}

export type TeamPulseCounts = {
  pendingInvites: number;
  unassignedManagers: number;
};

export function buildTeamPulseCounts(input: {
  invitations: { status: string }[];
  memberships: { role: string; status: string; location_ids?: string[] | null }[];
}): TeamPulseCounts {
  const pendingInvites = input.invitations.filter((invite) => invite.status === 'pending').length;
  const unassignedManagers = input.memberships.filter(
    (member) =>
      member.role === 'manager' &&
      member.status === 'active' &&
      (member.location_ids ?? []).length === 0,
  ).length;
  return { pendingInvites, unassignedManagers };
}

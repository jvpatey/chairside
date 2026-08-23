import { listClinicApplications, listWorkerApplications } from './applications';
import {
  clinicApplicationToCalendarEvents,
  openShiftPostToCalendarEvent,
  sortCalendarEvents,
  workerApplicationToCalendarEvents,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarEventRange,
  type OpenShiftLocation,
} from './calendarEventMappers';
import { isEmptyLocationScope, listShiftPosts, type ClinicLocationScopeOptions } from './posts';

export {
  clinicApplicationToCalendarEvents,
  openShiftPostToCalendarEvent,
  sortCalendarEvents,
  workerApplicationToCalendarEvents,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarEventRange,
  type OpenShiftLocation,
} from './calendarEventMappers';
import { getSupabaseClient } from './client';

async function fetchShiftLocationMap(
  locationIds: Array<string | null | undefined>,
): Promise<Map<string, OpenShiftLocation>> {
  const ids = [...new Set(locationIds.filter(Boolean) as string[])];
  if (ids.length === 0) return new Map();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_locations')
    .select('id, name, city, province')
    .in('id', ids)
    .eq('is_active', true);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      {
        name: row.name as string,
        city: (row.city as string | null) ?? null,
        province: row.province as string,
      },
    ]),
  );
}

function isTodayOrUpcomingShiftDate(shiftDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return shiftDate >= today;
}

export async function listWorkerCalendarEvents(
  workerId: string,
  range?: CalendarEventRange,
): Promise<CalendarEvent[]> {
  const applications = await listWorkerApplications(workerId);
  const events = applications.flatMap((application) =>
    workerApplicationToCalendarEvents(application, range),
  );
  return sortCalendarEvents(events);
}

export async function listClinicCalendarEvents(
  clinicId: string,
  range?: CalendarEventRange,
  options?: ClinicLocationScopeOptions,
): Promise<CalendarEvent[]> {
  if (isEmptyLocationScope(options?.locationIds)) return [];

  const supabase = getSupabaseClient();
  const applications = await listClinicApplications(clinicId, 'active', options);

  const shiftIds = applications
    .map((application) => application.shift_post_id)
    .filter(Boolean) as string[];

  const shiftMap = new Map<
    string,
    { shiftDate: string; startTime: string | null; endTime: string | null }
  >();

  if (shiftIds.length > 0) {
    const { data, error } = await supabase
      .from('shift_posts')
      .select('id, shift_date, start_time, end_time')
      .in('id', shiftIds);

    if (error) throw error;

    for (const shift of data ?? []) {
      shiftMap.set(shift.id, {
        shiftDate: shift.shift_date,
        startTime: shift.start_time,
        endTime: shift.end_time,
      });
    }
  }

  const events = applications.flatMap((application) => {
    const shiftTimes = application.shift_post_id
      ? shiftMap.get(application.shift_post_id)
      : undefined;
    return clinicApplicationToCalendarEvents(application, shiftTimes, range);
  });

  const shifts = await listShiftPosts(clinicId, options);
  const locationMap = await fetchShiftLocationMap(shifts.map((shift) => shift.location_id));
  const openFillInEvents = shifts
    .filter((shift) => shift.status === 'live' && isTodayOrUpcomingShiftDate(shift.shift_date))
    .map((shift) =>
      openShiftPostToCalendarEvent(
        shift,
        shift.location_id ? locationMap.get(shift.location_id) : null,
        range,
      ),
    )
    .filter((event): event is CalendarEvent => event != null);

  return sortCalendarEvents([...events, ...openFillInEvents]);
}

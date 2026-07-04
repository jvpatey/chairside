import { listClinicApplications, listWorkerApplications } from './applications';
import {
  clinicApplicationToCalendarEvents,
  sortCalendarEvents,
  workerApplicationToCalendarEvents,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarEventRange,
} from './calendarEventMappers';

export {
  clinicApplicationToCalendarEvents,
  sortCalendarEvents,
  workerApplicationToCalendarEvents,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarEventRange,
} from './calendarEventMappers';
import { getSupabaseClient } from './client';

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
): Promise<CalendarEvent[]> {
  const supabase = getSupabaseClient();
  const applications = await listClinicApplications(clinicId);

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

  return sortCalendarEvents(events);
}

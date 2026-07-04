import { DELETED_CANDIDATE_LABEL, DELETED_CLINIC_LABEL } from '@chairside/config';

import type { ApplicationStatus } from './applications';

export type CalendarEventKind = 'confirmed_fill_in' | 'interview';

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  startsAt: string;
  endsAt: string | null;
  title: string;
  subtitle: string;
  status: ApplicationStatus;
  applicationId: string;
  jobPostId: string | null;
  shiftPostId: string | null;
  postType: 'job' | 'shift';
  dateKey: string;
  location: string | null;
  counterpartName: string;
  roleType: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  durationMinutes: number | null;
};

export type CalendarEventRange = {
  start: string;
  end: string;
};

export type WorkerCalendarSource = {
  id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  status: ApplicationStatus;
  interview_at: string | null;
  interview_duration_minutes: number | null;
  role_type: string | null;
  post_title: string;
  post_type: 'job' | 'shift';
  post_role_type?: string | null;
  shift_date?: string | null;
  shift_start_time?: string | null;
  shift_end_time?: string | null;
  clinic_name: string;
  clinic_city: string | null;
  clinic_province?: string | null;
  clinic_location?: string | null;
  clinic_account_deleted: boolean;
};

export type ClinicCalendarSource = {
  id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  status: ApplicationStatus;
  interview_at: string | null;
  interview_duration_minutes: number | null;
  role_type: string | null;
  post_title: string;
  post_type: 'job' | 'shift';
  post_role_type: string;
  worker_display_name: string | null;
  worker_account_deleted: boolean;
};

function normalizeTime24h(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value.trim();
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function dateKeyFromIso(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function combineDateAndTime(dateKey: string, time: string | null | undefined): string {
  if (!time?.trim()) return `${dateKey}T00:00:00`;
  return `${dateKey}T${normalizeTime24h(time)}:00`;
}

function addMinutesToIso(iso: string, minutes: number): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  parsed.setMinutes(parsed.getMinutes() + minutes);
  return parsed.toISOString();
}

function isWithinRange(dateKey: string, range?: CalendarEventRange): boolean {
  if (!range) return true;
  return dateKey >= range.start && dateKey <= range.end;
}

function formatClinicLocation(
  city: string | null | undefined,
  province: string | null | undefined,
): string | null {
  const parts = [city?.trim(), province?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function workerApplicationToCalendarEvents(
  application: WorkerCalendarSource,
  range?: CalendarEventRange,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const clinicName = application.clinic_account_deleted
    ? DELETED_CLINIC_LABEL
    : application.clinic_name?.trim() || 'Clinic';
  const location = application.clinic_account_deleted
    ? formatClinicLocation(application.clinic_city, application.clinic_province)
    : application.clinic_location ??
      formatClinicLocation(application.clinic_city, application.clinic_province);

  if (application.status === 'hired' && application.post_type === 'shift' && application.shift_date) {
    const dateKey = application.shift_date;
    if (isWithinRange(dateKey, range)) {
      const startsAt = combineDateAndTime(dateKey, application.shift_start_time);
      const endsAt = application.shift_end_time
        ? combineDateAndTime(dateKey, application.shift_end_time)
        : null;
      events.push({
        id: `fill-in-${application.id}`,
        kind: 'confirmed_fill_in',
        startsAt,
        endsAt,
        title: application.post_title,
        subtitle: clinicName,
        status: application.status,
        applicationId: application.id,
        jobPostId: application.job_post_id,
        shiftPostId: application.shift_post_id,
        postType: 'shift',
        dateKey,
        location,
        counterpartName: clinicName,
        roleType: application.post_role_type ?? application.role_type ?? null,
        shiftStartTime: application.shift_start_time ?? null,
        shiftEndTime: application.shift_end_time ?? null,
        durationMinutes: null,
      });
    }
  }

  if (application.status === 'interview_scheduled' && application.interview_at) {
    const dateKey = dateKeyFromIso(application.interview_at);
    if (dateKey && isWithinRange(dateKey, range)) {
      const durationMinutes = application.interview_duration_minutes ?? 60;
      events.push({
        id: `interview-${application.id}`,
        kind: 'interview',
        startsAt: application.interview_at,
        endsAt: addMinutesToIso(application.interview_at, durationMinutes),
        title: application.post_type === 'job' ? application.post_title : 'Fill-in interview',
        subtitle: clinicName,
        status: application.status,
        applicationId: application.id,
        jobPostId: application.job_post_id,
        shiftPostId: application.shift_post_id,
        postType: application.post_type,
        dateKey,
        location,
        counterpartName: clinicName,
        roleType: application.post_role_type ?? application.role_type ?? null,
        shiftStartTime: application.shift_start_time ?? null,
        shiftEndTime: application.shift_end_time ?? null,
        durationMinutes,
      });
    }
  }

  return events;
}

function getApplicantDisplayName(
  application: Pick<ClinicCalendarSource, 'worker_display_name' | 'worker_account_deleted'>,
): string {
  if (application.worker_account_deleted) return DELETED_CANDIDATE_LABEL;
  return application.worker_display_name?.trim() || 'Applicant';
}

export function clinicApplicationToCalendarEvents(
  application: ClinicCalendarSource,
  shiftTimes?: { shiftDate: string; startTime: string | null; endTime: string | null },
  range?: CalendarEventRange,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const workerName = getApplicantDisplayName(application);

  if (
    application.status === 'hired' &&
    application.post_type === 'shift' &&
    shiftTimes?.shiftDate
  ) {
    const dateKey = shiftTimes.shiftDate;
    if (isWithinRange(dateKey, range)) {
      const startsAt = combineDateAndTime(dateKey, shiftTimes.startTime);
      const endsAt = shiftTimes.endTime
        ? combineDateAndTime(dateKey, shiftTimes.endTime)
        : null;
      events.push({
        id: `fill-in-${application.id}`,
        kind: 'confirmed_fill_in',
        startsAt,
        endsAt,
        title: application.post_title,
        subtitle: workerName,
        status: application.status,
        applicationId: application.id,
        jobPostId: application.job_post_id,
        shiftPostId: application.shift_post_id,
        postType: 'shift',
        dateKey,
        location: null,
        counterpartName: workerName,
        roleType: application.post_role_type ?? application.role_type ?? null,
        shiftStartTime: shiftTimes.startTime,
        shiftEndTime: shiftTimes.endTime,
        durationMinutes: null,
      });
    }
  }

  if (application.status === 'interview_scheduled' && application.interview_at) {
    const dateKey = dateKeyFromIso(application.interview_at);
    if (dateKey && isWithinRange(dateKey, range)) {
      const durationMinutes = application.interview_duration_minutes ?? 60;
      events.push({
        id: `interview-${application.id}`,
        kind: 'interview',
        startsAt: application.interview_at,
        endsAt: addMinutesToIso(application.interview_at, durationMinutes),
        title: application.post_type === 'job' ? application.post_title : 'Fill-in interview',
        subtitle: workerName,
        status: application.status,
        applicationId: application.id,
        jobPostId: application.job_post_id,
        shiftPostId: application.shift_post_id,
        postType: application.post_type,
        dateKey,
        location: null,
        counterpartName: workerName,
        roleType: application.post_role_type ?? application.role_type ?? null,
        shiftStartTime: null,
        shiftEndTime: null,
        durationMinutes,
      });
    }
  }

  return events;
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const startCompare = a.startsAt.localeCompare(b.startsAt);
    if (startCompare !== 0) return startCompare;
    return a.title.localeCompare(b.title);
  });
}

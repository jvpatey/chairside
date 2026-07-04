import { describe, expect, it } from 'vitest';

import type { CalendarEventRange } from './calendarEventMappers';
import {
  clinicApplicationToCalendarEvents,
  workerApplicationToCalendarEvents,
} from './calendarEventMappers';

describe('calendarEventMappers', () => {
  it('maps worker confirmed fill-ins and interviews', () => {
    const fillInEvents = workerApplicationToCalendarEvents({
      id: 'app-1',
      job_post_id: null,
      shift_post_id: 'shift-1',
      status: 'hired',
      interview_at: null,
      interview_duration_minutes: null,
      role_type: 'dental_assistant',
      post_title: 'Fill-in · 2026-07-10',
      post_type: 'shift',
      post_role_type: 'dental_assistant',
      shift_date: '2026-07-10',
      shift_start_time: '08:00',
      shift_end_time: '17:00',
      clinic_name: 'Harbour Dental',
      clinic_city: 'Halifax',
      clinic_province: 'NS',
      clinic_account_deleted: false,
    });

    expect(fillInEvents).toHaveLength(1);
    expect(fillInEvents[0]?.kind).toBe('confirmed_fill_in');
    expect(fillInEvents[0]?.dateKey).toBe('2026-07-10');

    const interviewEvents = workerApplicationToCalendarEvents({
      id: 'app-2',
      job_post_id: 'job-1',
      shift_post_id: null,
      status: 'interview_scheduled',
      interview_at: '2026-07-12T18:30:00.000Z',
      interview_duration_minutes: 45,
      role_type: 'dental_hygienist',
      post_title: 'Dental Hygienist',
      post_type: 'job',
      clinic_name: 'Harbour Dental',
      clinic_city: 'Halifax',
      clinic_province: 'NS',
      clinic_account_deleted: false,
    });

    expect(interviewEvents).toHaveLength(1);
    expect(interviewEvents[0]?.kind).toBe('interview');
  });

  it('respects calendar ranges', () => {
    const range: CalendarEventRange = { start: '2026-07-01', end: '2026-07-11' };
    const events = workerApplicationToCalendarEvents(
      {
        id: 'app-3',
        job_post_id: null,
        shift_post_id: 'shift-2',
        status: 'hired',
        interview_at: null,
        interview_duration_minutes: null,
        role_type: 'dental_assistant',
        post_title: 'Fill-in · 2026-07-20',
        post_type: 'shift',
        shift_date: '2026-07-20',
        shift_start_time: '08:00',
        shift_end_time: '17:00',
        clinic_name: 'Harbour Dental',
        clinic_city: 'Halifax',
        clinic_province: 'NS',
        clinic_account_deleted: false,
      },
      range,
    );

    expect(events).toHaveLength(0);
  });

  it('maps clinic scheduled interviews', () => {
    const events = clinicApplicationToCalendarEvents({
      id: 'app-4',
      job_post_id: 'job-1',
      shift_post_id: null,
      status: 'interview_scheduled',
      interview_at: '2026-07-08T15:00:00.000Z',
      interview_duration_minutes: 30,
      role_type: 'dental_hygienist',
      post_title: 'Dental Hygienist',
      post_type: 'job',
      post_role_type: 'dental_hygienist',
      worker_display_name: 'Jordan',
      worker_account_deleted: false,
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.counterpartName).toBe('Jordan');
  });
});

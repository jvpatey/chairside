import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  getWorkerRoleTypes: () => [],
  isClinicLocationRecordComplete: (location: {
    address_line1?: string | null;
    software_used?: string[] | null;
  }) => Boolean(location.address_line1?.trim()) && (location.software_used?.length ?? 0) > 0,
  isClinicProfileComplete: () => true,
  isWorkerProfileComplete: () => true,
}));

import {
  getAccountTypeLabel,
  getClinicLocationsSubtitle,
  getNotificationsSubtitle,
  getOtherAlertsSubtitle,
  getTextAlertsStatusLabel,
  getTextAlertsStatusTone,
  getTextAlertsSubtitle,
} from '@/lib/profileHubSubtitles';

describe('getAccountTypeLabel', () => {
  it('labels worker and clinic account types', () => {
    expect(getAccountTypeLabel('worker')).toBe('Worker');
    expect(getAccountTypeLabel('clinic')).toBe('Clinic');
    expect(getAccountTypeLabel('clinic', { isGroup: false })).toBe('Clinic');
    expect(getAccountTypeLabel('clinic', { isGroup: true })).toBe('Clinic group');
  });
});

describe('getTextAlertsStatusLabel', () => {
  it('returns short On / Off / Add phone without phone number', () => {
    expect(
      getTextAlertsStatusLabel({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('On');
    expect(
      getTextAlertsStatusLabel({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toBe('Add phone');
    expect(
      getTextAlertsStatusLabel({
        short_notice_available: false,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('Off');
  });
});

describe('getTextAlertsStatusTone', () => {
  it('maps status to on / needs_phone / off', () => {
    expect(
      getTextAlertsStatusTone({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('on');
    expect(
      getTextAlertsStatusTone({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toBe('needs_phone');
    expect(
      getTextAlertsStatusTone({
        short_notice_available: true,
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toBe('off');
  });
});

describe('getTextAlertsSubtitle', () => {
  it('shows off when fill-ins are off', () => {
    expect(
      getTextAlertsSubtitle({
        short_notice_available: false,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('Off');
  });

  it('shows on with phone when SMS is active', () => {
    expect(
      getTextAlertsSubtitle({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toMatch(/^On ·/);
  });

  it('shows add phone and off states', () => {
    expect(
      getTextAlertsSubtitle({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toBe('Add phone');
    expect(
      getTextAlertsSubtitle({
        short_notice_available: true,
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toBe('Off');
  });
});

describe('getOtherAlertsSubtitle', () => {
  it('keeps a quiet hub label', () => {
    expect(getOtherAlertsSubtitle()).toBe('Push · fill-ins and roles');
  });
});

describe('getNotificationsSubtitle', () => {
  it('omits texts when fill-ins are off', () => {
    expect(
      getNotificationsSubtitle({
        job_notification_opt_in: true,
        short_notice_available: false,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('Jobs: On · Fill-ins: Off');
  });

  it('includes texts status when fill-ins are on', () => {
    expect(
      getNotificationsSubtitle({
        job_notification_opt_in: false,
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('Jobs: Off · Fill-ins: On · Texts: On');

    expect(
      getNotificationsSubtitle({
        job_notification_opt_in: true,
        short_notice_available: true,
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toBe('Jobs: On · Fill-ins: On · Texts: Off');

    expect(
      getNotificationsSubtitle({
        job_notification_opt_in: true,
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toBe('Jobs: On · Fill-ins: On · Texts: Needs phone');
  });
});

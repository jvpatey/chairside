import { describe, expect, it } from 'vitest';

import {
  getFillInAvailabilityCollapsedSummary,
  getFillInSmsStatus,
  getFillInSmsSubtitlePart,
} from '@/lib/fillInAvailabilitySummary';

describe('getFillInSmsStatus', () => {
  it('is inactive when fill-ins are off', () => {
    expect(
      getFillInSmsStatus({
        short_notice_available: false,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toEqual({ fillInsOn: false, smsActive: false, smsNeedsPhone: false });
  });

  it('is active when opted in with a phone', () => {
    expect(
      getFillInSmsStatus({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toEqual({ fillInsOn: true, smsActive: true, smsNeedsPhone: false });
  });

  it('needs phone when opted in without a number', () => {
    expect(
      getFillInSmsStatus({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toEqual({ fillInsOn: true, smsActive: false, smsNeedsPhone: true });
  });
});

describe('getFillInSmsSubtitlePart', () => {
  it('returns null when fill-ins are off', () => {
    expect(getFillInSmsSubtitlePart({ short_notice_available: false } as never)).toBeNull();
  });

  it('labels on, off, and needs phone', () => {
    expect(
      getFillInSmsSubtitlePart({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBe('Texts: On');
    expect(
      getFillInSmsSubtitlePart({
        short_notice_available: true,
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toBe('Texts: Off');
    expect(
      getFillInSmsSubtitlePart({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '',
      } as never),
    ).toBe('Texts: Needs phone');
  });
});

describe('getFillInAvailabilityCollapsedSummary', () => {
  it('includes texts status when available', () => {
    const textsOn = getFillInAvailabilityCollapsedSummary(
      {
        short_notice_available: true,
        fill_in_notification_mode: 'all',
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never,
      [],
    );
    expect(textsOn.primary).toBe('Available · Texts on · All fill-ins');
    expect(textsOn.primarySegments).toEqual([
      { text: 'Available', tone: 'positive' },
      { text: 'Texts on', tone: 'positive' },
      { text: 'All fill-ins', tone: 'default' },
    ]);

    const textsOff = getFillInAvailabilityCollapsedSummary(
      {
        short_notice_available: true,
        fill_in_notification_mode: 'available_days_only',
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never,
      [],
    );
    expect(textsOff.primary).toBe('Available · Texts off · Matching days only');
    expect(textsOff.primarySegments).toEqual([
      { text: 'Available', tone: 'positive' },
      { text: 'Texts off', tone: 'negative' },
      { text: 'Matching days only', tone: 'default' },
    ]);
  });
});

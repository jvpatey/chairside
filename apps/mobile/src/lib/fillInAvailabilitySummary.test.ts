import { describe, expect, it } from 'vitest';

import {
  getFillInAvailabilityCollapsedSummary,
  getFillInSmsBadgePresentation,
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

describe('getFillInSmsBadgePresentation', () => {
  it('returns null when fill-ins are off', () => {
    expect(
      getFillInSmsBadgePresentation({ short_notice_available: false } as never),
    ).toBeNull();
  });

  it('maps on, off, and needs phone', () => {
    expect(
      getFillInSmsBadgePresentation({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toEqual({ tone: 'on', label: 'Text alerts on', showDot: true });
    expect(
      getFillInSmsBadgePresentation({
        short_notice_available: true,
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toEqual({ tone: 'off', label: 'Text alerts off', showDot: false });
    expect(
      getFillInSmsBadgePresentation({
        short_notice_available: true,
        fill_in_sms_opt_in: true,
        phone: '',
      } as never),
    ).toEqual({ tone: 'needs_phone', label: 'Add phone for texts', showDot: false });
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
    expect(textsOn.primary).toBe('Open to fill-ins · Texts on');
    expect(textsOn.primarySegments).toEqual([
      { text: 'Open to fill-ins', tone: 'positive' },
      { text: 'Texts on', tone: 'positive' },
    ]);

    const textsOff = getFillInAvailabilityCollapsedSummary(
      {
        short_notice_available: true,
        fill_in_notification_mode: 'all',
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never,
      [],
    );
    expect(textsOff.primary).toBe('Open to fill-ins · Texts off');
    expect(textsOff.primarySegments).toEqual([
      { text: 'Open to fill-ins', tone: 'positive' },
      { text: 'Texts off', tone: 'negative' },
    ]);

    const needsPhone = getFillInAvailabilityCollapsedSummary(
      {
        short_notice_available: true,
        fill_in_notification_mode: 'all',
        fill_in_sms_opt_in: true,
        phone: null,
      } as never,
      [],
    );
    expect(needsPhone.primary).toBe('Open to fill-ins · Needs phone');
  });
});

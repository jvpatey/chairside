import { describe, expect, it } from 'vitest';

import {
  FILL_IN_NUDGE_SNOOZE_MS,
  getFillInNudgeState,
  parseFillInNudgeSnooze,
  shouldShowFillInNudge,
} from '@/lib/fillInNudge';

describe('getFillInNudgeState', () => {
  it('returns null without a profile', () => {
    expect(getFillInNudgeState(null)).toBeNull();
  });

  it('flags fill-ins off for new accounts', () => {
    expect(
      getFillInNudgeState({
        short_notice_available: false,
        fill_in_notification_mode: 'off',
      } as never),
    ).toBe('fill_ins_off');
  });

  it('flags fill-ins off when available but alerts are off', () => {
    expect(
      getFillInNudgeState({
        short_notice_available: true,
        fill_in_notification_mode: 'off',
      } as never),
    ).toBe('fill_ins_off');
  });

  it('flags texts off when fill-ins are on without SMS', () => {
    expect(
      getFillInNudgeState({
        short_notice_available: true,
        fill_in_notification_mode: 'all',
        fill_in_sms_opt_in: false,
        phone: '9025551234',
      } as never),
    ).toBe('texts_off');
  });

  it('flags texts off when opted in without a phone', () => {
    expect(
      getFillInNudgeState({
        short_notice_available: true,
        fill_in_notification_mode: 'available_days_only',
        fill_in_sms_opt_in: true,
        phone: null,
      } as never),
    ).toBe('texts_off');
  });

  it('returns null when fill-ins and texts are on', () => {
    expect(
      getFillInNudgeState({
        short_notice_available: true,
        fill_in_notification_mode: 'all',
        fill_in_sms_opt_in: true,
        phone: '9025551234',
      } as never),
    ).toBeNull();
  });
});

describe('shouldShowFillInNudge', () => {
  const now = 1_800_000_000_000;

  it('hides when there is nothing to nudge', () => {
    expect(shouldShowFillInNudge(null, null, now)).toBe(false);
  });

  it('shows when never snoozed', () => {
    expect(shouldShowFillInNudge('fill_ins_off', null, now)).toBe(true);
  });

  it('hides during an active snooze for the same state', () => {
    expect(
      shouldShowFillInNudge('fill_ins_off', { state: 'fill_ins_off', snoozedAt: now - 1000 }, now),
    ).toBe(false);
  });

  it('shows again after the snooze expires', () => {
    expect(
      shouldShowFillInNudge(
        'fill_ins_off',
        { state: 'fill_ins_off', snoozedAt: now - FILL_IN_NUDGE_SNOOZE_MS },
        now,
      ),
    ).toBe(true);
  });

  it('ignores a snooze from a different state', () => {
    expect(
      shouldShowFillInNudge('texts_off', { state: 'fill_ins_off', snoozedAt: now - 1000 }, now),
    ).toBe(true);
  });
});

describe('parseFillInNudgeSnooze', () => {
  it('parses a stored snooze', () => {
    expect(parseFillInNudgeSnooze('{"state":"texts_off","snoozedAt":42}')).toEqual({
      state: 'texts_off',
      snoozedAt: 42,
    });
  });

  it('rejects invalid values', () => {
    expect(parseFillInNudgeSnooze(null)).toBeNull();
    expect(parseFillInNudgeSnooze('not json')).toBeNull();
    expect(parseFillInNudgeSnooze('{"state":"other","snoozedAt":1}')).toBeNull();
  });
});

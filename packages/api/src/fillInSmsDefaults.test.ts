import { describe, expect, it } from 'vitest';

import {
  FILL_IN_SMS_DEFAULTS,
  shouldEnableFillInSmsDefaults,
} from './fillInSmsDefaults';

describe('shouldEnableFillInSmsDefaults', () => {
  it('enables when saving the first phone', () => {
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '9025550100',
        previousPhone: null,
      }),
    ).toBe(true);
  });

  it('does not enable when previous phone already exists', () => {
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '9025550100',
        previousPhone: '9025559999',
      }),
    ).toBe(false);
  });

  it('does not enable when next phone is empty', () => {
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '  ',
        previousPhone: null,
      }),
    ).toBe(false);
  });

  it('respects explicit opt-out on the same write', () => {
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '9025550100',
        previousPhone: null,
        explicitShortNotice: false,
      }),
    ).toBe(false);
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '9025550100',
        previousPhone: null,
        explicitNotificationMode: 'off',
      }),
    ).toBe(false);
    expect(
      shouldEnableFillInSmsDefaults({
        nextPhone: '9025550100',
        previousPhone: null,
        explicitSmsOptIn: false,
      }),
    ).toBe(false);
  });
});

describe('FILL_IN_SMS_DEFAULTS', () => {
  it('turns fill-in SMS alerts fully on', () => {
    expect(FILL_IN_SMS_DEFAULTS).toEqual({
      fill_in_sms_opt_in: true,
      short_notice_available: true,
      fill_in_notification_mode: 'all',
    });
  });
});

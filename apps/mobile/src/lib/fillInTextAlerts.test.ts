import { describe, expect, it } from 'vitest';

import {
  getFillInTextAlertsHint,
  getFillInTextAlertsState,
  isFillInTextAlertsSwitchOn,
} from '@/lib/fillInTextAlerts';

const base = { smsOptIn: false, savedPhone: null, isFinishing: false, isChangingNumber: false };

describe('getFillInTextAlertsState', () => {
  it('needs a phone when nothing is saved', () => {
    expect(getFillInTextAlertsState(base)).toBe('off_needs_phone');
  });

  it('is ready for one tap when a phone is saved', () => {
    expect(getFillInTextAlertsState({ ...base, savedPhone: '9025551234' })).toBe('off_ready');
  });

  it('is on when opted in with a saved phone', () => {
    expect(
      getFillInTextAlertsState({ ...base, smsOptIn: true, savedPhone: '9025551234' }),
    ).toBe('on');
  });

  it('is finishing after the switch is turned on without a phone', () => {
    expect(getFillInTextAlertsState({ ...base, isFinishing: true })).toBe('finishing');
  });

  it('treats opted-in without a phone as needing a phone', () => {
    expect(getFillInTextAlertsState({ ...base, smsOptIn: true })).toBe('off_needs_phone');
  });

  it('only allows changing a number that exists', () => {
    expect(
      getFillInTextAlertsState({ ...base, savedPhone: '9025551234', isChangingNumber: true }),
    ).toBe('changing_number');
    expect(getFillInTextAlertsState({ ...base, isChangingNumber: true })).toBe('off_needs_phone');
  });
});

describe('isFillInTextAlertsSwitchOn', () => {
  it('shows on while finishing so the switch responds immediately', () => {
    expect(isFillInTextAlertsSwitchOn('finishing', false)).toBe(true);
  });

  it('keeps the saved opt-in while changing number', () => {
    expect(isFillInTextAlertsSwitchOn('changing_number', true)).toBe(true);
    expect(isFillInTextAlertsSwitchOn('changing_number', false)).toBe(false);
  });

  it('is off when not opted in', () => {
    expect(isFillInTextAlertsSwitchOn('off_ready', false)).toBe(false);
    expect(isFillInTextAlertsSwitchOn('off_needs_phone', false)).toBe(false);
  });
});

describe('getFillInTextAlertsHint', () => {
  it('shows the saved number when on', () => {
    expect(getFillInTextAlertsHint('on', '9025551234')).toBe('Texts go to (902) 555-1234.');
  });

  it('asks for a number while finishing', () => {
    expect(getFillInTextAlertsHint('finishing', null)).toContain('Add your mobile number');
  });
});

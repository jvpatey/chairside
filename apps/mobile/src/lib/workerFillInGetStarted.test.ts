import { describe, expect, it } from 'vitest';

import { isWorkerFillInsStepComplete } from './workerFillInGetStarted';

describe('isWorkerFillInsStepComplete', () => {
  it('completes when the worker submitted a fill-in application', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 1,
      }),
    ).toBe(true);
  });

  it('completes when fill-ins and alerts are on', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        workerProfile: {
          short_notice_available: true,
          fill_in_notification_mode: 'available_days_only',
        },
      }),
    ).toBe(true);
  });

  it('stays incomplete when available but alerts are off', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        workerProfile: {
          short_notice_available: true,
          fill_in_notification_mode: 'off',
        },
      }),
    ).toBe(false);
  });

  it('stays incomplete for a brand-new worker with fill-ins off', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        workerProfile: {
          short_notice_available: false,
          fill_in_notification_mode: 'off',
        },
      }),
    ).toBe(false);
  });
});

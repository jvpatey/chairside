import { describe, expect, it } from 'vitest';

import { isWorkerFillInsStepComplete } from './workerFillInGetStarted';

describe('isWorkerFillInsStepComplete', () => {
  it('completes when the worker submitted a fill-in application', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 1,
        visitedFillIns: false,
      }),
    ).toBe(true);
  });

  it('completes when the fill-ins tab was visited on this device', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        visitedFillIns: true,
      }),
    ).toBe(true);
  });

  it('completes when fill-in availability is enabled on the profile', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        visitedFillIns: false,
        workerProfile: {
          short_notice_available: true,
          fill_in_notification_mode: 'off',
        },
      }),
    ).toBe(true);
  });

  it('completes when the worker saved a fill-in or set a schedule', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        visitedFillIns: false,
        savedShiftCount: 1,
      }),
    ).toBe(true);

    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        visitedFillIns: false,
        availabilityBlockCount: 2,
      }),
    ).toBe(true);
  });

  it('stays incomplete for a brand-new worker with no fill-in engagement', () => {
    expect(
      isWorkerFillInsStepComplete({
        shiftApplicationCount: 0,
        visitedFillIns: false,
        workerProfile: {
          short_notice_available: false,
          fill_in_notification_mode: 'off',
        },
      }),
    ).toBe(false);
  });
});

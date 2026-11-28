import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  isClinicGroupsEnabled: () => false,
}));

import {
  getSetupStepIndexFromPath,
  getSetupStepNumber,
  WORKER_SETUP_STEPS,
} from './setupSteps';

describe('setupSteps', () => {
  it('resolves worker step index from pathname', () => {
    expect(getSetupStepIndexFromPath('worker', '/(worker-setup)/location', false)).toBe(1);
    expect(getSetupStepIndexFromPath('worker', '/(worker-setup)/fill-ins', false)).toBe(2);
    expect(getSetupStepIndexFromPath('worker', '/(worker-setup)/review', false)).toBe(3);
  });

  it('returns worker step numbers for the setup wizard', () => {
    expect(getSetupStepNumber('worker', 'basics', false)).toEqual({ step: 1, total: 4 });
    expect(getSetupStepNumber('worker', 'location', false)).toEqual({ step: 2, total: 4 });
    expect(getSetupStepNumber('worker', 'fill-ins', false)).toEqual({ step: 3, total: 4 });
    expect(getSetupStepNumber('worker', 'review', false)).toEqual({
      step: 4,
      total: WORKER_SETUP_STEPS.length,
    });
  });
});

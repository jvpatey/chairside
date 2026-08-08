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
    expect(getSetupStepIndexFromPath('worker', '/(worker-setup)/skills', false)).toBe(2);
    expect(getSetupStepIndexFromPath('worker', '/(worker-setup)/review', false)).toBe(4);
  });

  it('returns worker step numbers for the setup wizard', () => {
    expect(getSetupStepNumber('worker', 'basics', false)).toEqual({ step: 1, total: 5 });
    expect(getSetupStepNumber('worker', 'location', false)).toEqual({ step: 4, total: 5 });
    expect(getSetupStepNumber('worker', 'review', false)).toEqual({
      step: 5,
      total: WORKER_SETUP_STEPS.length,
    });
  });
});

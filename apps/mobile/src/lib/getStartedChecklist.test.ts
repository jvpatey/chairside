import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  isClinicProfileComplete: (profile: unknown) => Boolean(profile),
  isWorkerProfileComplete: () => true,
}));

import {
  areAllGetStartedItemsComplete,
  isClinicGetStartedComplete,
  isClinicPostingStepComplete,
} from '@/lib/getStartedChecklist';

describe('clinic get started checklist', () => {
  it('treats either a role or a fill-in as enough for the posting step', () => {
    expect(isClinicPostingStepComplete({ fillInsPosted: 0, openRoles: 1 })).toBe(true);
    expect(isClinicPostingStepComplete({ fillInsPosted: 2, openRoles: 0 })).toBe(true);
    expect(isClinicPostingStepComplete({ fillInsPosted: 0, openRoles: 0 })).toBe(false);
  });

  it('does not require both role and fill-in to finish get started', () => {
    const base = {
      clinicProfile: { clinic_name: 'Dental Clinic' } as never,
      totalApplications: 1,
      conversationCount: 0,
    };

    expect(
      isClinicGetStartedComplete({
        ...base,
        fillInsPosted: 0,
        openRoles: 1,
      }),
    ).toBe(true);

    expect(
      isClinicGetStartedComplete({
        ...base,
        fillInsPosted: 1,
        openRoles: 0,
      }),
    ).toBe(true);

    expect(
      isClinicGetStartedComplete({
        ...base,
        fillInsPosted: 0,
        openRoles: 0,
      }),
    ).toBe(false);
  });

  it('hides when every checklist item is complete', () => {
    expect(
      areAllGetStartedItemsComplete([
        { id: 'a', title: 'A', body: '', complete: true, onPress: () => undefined },
        { id: 'b', title: 'B', body: '', complete: true, onPress: () => undefined },
      ]),
    ).toBe(true);
  });
});

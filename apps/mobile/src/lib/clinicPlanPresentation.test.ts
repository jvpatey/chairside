import { describe, expect, it } from 'vitest';

import {
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  isFillInPostingLimitReached,
  isRolePostingLimitReached,
} from './clinicPlanPresentation';

describe('clinicPlanPresentation posting limits', () => {
  it('detects role and fill-in posting limits', () => {
    expect(isRolePostingLimitReached({ canPublishRole: false })).toBe(true);
    expect(isRolePostingLimitReached({ canPublishRole: true })).toBe(false);
    expect(isRolePostingLimitReached(null)).toBe(false);

    expect(isFillInPostingLimitReached({ canPublishFillIn: false })).toBe(true);
    expect(isFillInPostingLimitReached({ canPublishFillIn: true })).toBe(false);
    expect(isFillInPostingLimitReached(undefined)).toBe(false);
  });

  it('formats limit titles', () => {
    expect(getClinicPostingLimitTitle('role')).toBe('Role limit reached');
    expect(getClinicPostingLimitTitle('fill-in')).toBe('Fill-in limit reached');
  });

  it('formats free plan role limit messages', () => {
    expect(
      getClinicPostingLimitReachedMessage(
        { plan: 'free', activeRoleLimit: 1, activeFillInLimit: 1 },
        'role',
      ),
    ).toBe(
      'You have reached your Free plan limit of 1 active role. Remove an active role or upgrade your plan to post more.',
    );
  });

  it('formats starter plan fill-in limit messages', () => {
    expect(
      getClinicPostingLimitReachedMessage(
        { plan: 'starter', activeRoleLimit: 3, activeFillInLimit: 3 },
        'fill-in',
      ),
    ).toBe(
      'You have reached your Starter plan limit of 3 active fill-ins. Remove an active fill-in or upgrade your plan to post more.',
    );
  });
});

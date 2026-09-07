import { describe, expect, it } from 'vitest';

import { formatTeamMemberSubtitle } from '@/lib/clinicTeamAccess';

describe('formatTeamMemberSubtitle', () => {
  it('summarizes owner access', () => {
    expect(formatTeamMemberSubtitle({ role: 'owner' })).toBe(
      'Owner · Full access to all locations',
    );
  });

  it('summarizes manager clinics', () => {
    expect(
      formatTeamMemberSubtitle({
        role: 'manager',
        title: 'Office Manager',
        locationNames: ['Downtown', 'Dartmouth'],
      }),
    ).toBe('Office Manager · Downtown, Dartmouth');
  });

  it('summarizes pending invites', () => {
    expect(
      formatTeamMemberSubtitle({
        role: 'pending',
        locationNames: ['Downtown'],
      }),
    ).toBe('Invite pending · Downtown');
  });
});

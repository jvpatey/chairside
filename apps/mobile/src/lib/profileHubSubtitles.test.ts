import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  getWorkerRoleTypes: () => [],
  isClinicProfileComplete: () => true,
  isWorkerProfileComplete: () => true,
}));

import { getClinicMessagingSubtitle } from '@/lib/profileHubSubtitles';

describe('getClinicMessagingSubtitle', () => {
  it('distinguishes locked Free from off-by-choice', () => {
    expect(getClinicMessagingSubtitle(null, { locked: true })).toBe('Upgrade for open inquiries');
    expect(
      getClinicMessagingSubtitle({ accepts_general_candidate_messages: true } as never),
    ).toBe('Open to inquiries');
    expect(
      getClinicMessagingSubtitle({ accepts_general_candidate_messages: false } as never),
    ).toBe('Not open to inquiries');
  });
});

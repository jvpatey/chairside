import { describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  getSupabaseClient: () => ({ rpc: vi.fn() }),
}));

import { isClinicBillingLimitError } from './billing';

describe('isClinicBillingLimitError', () => {
  it('detects Phase B feature and cap error strings', () => {
    expect(
      isClinicBillingLimitError('Screening questions require a paid clinic plan.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError('CRM notes and follow-ups require a paid clinic plan.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError('Application PDF export requires a paid clinic plan.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError('Clinic discover requires a paid clinic plan.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError('General candidate messaging requires a paid clinic plan.'),
    ).toBe(true);
    expect(isClinicBillingLimitError('Open inquiries require a paid clinic plan.')).toBe(true);
    expect(isClinicBillingLimitError('Open inquiries require a Pro plan.')).toBe(true);
    expect(
      isClinicBillingLimitError('Location limit reached. Upgrade your plan to add more locations.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError('Manager limit reached. Upgrade your plan to invite more managers.'),
    ).toBe(true);
    expect(
      isClinicBillingLimitError(
        'Custom screening question limit reached. Upgrade to Pro for unlimited custom questions.',
      ),
    ).toBe(true);
    expect(isClinicBillingLimitError('Hiring insights require a Pro plan.')).toBe(true);
    expect(isClinicBillingLimitError('Bulk fill-in outreach requires a Pro plan.')).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isClinicBillingLimitError('Could not save location.')).toBe(false);
  });
});

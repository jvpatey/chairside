import { describe, expect, it } from 'vitest';

import {
  clinicPlanIncludesFeature,
  formatClinicActiveOpportunityLimit,
  resolveClinicPlanFromEntitlements,
} from './billing';

describe('billing config', () => {
  it('resolves pro over starter entitlements', () => {
    expect(
      resolveClinicPlanFromEntitlements({ clinic_starter: true, clinic_pro: true }),
    ).toBe('pro');
  });

  it('gates outreach and sms to paid plans', () => {
    expect(clinicPlanIncludesFeature('free', 'fill_in_outreach')).toBe(false);
    expect(clinicPlanIncludesFeature('starter', 'fill_in_sms')).toBe(true);
    expect(clinicPlanIncludesFeature('pro', 'priority_listing')).toBe(true);
  });

  it('formats opportunity limits', () => {
    expect(formatClinicActiveOpportunityLimit('free')).toBe('1');
    expect(formatClinicActiveOpportunityLimit('pro')).toBe('Unlimited');
  });
});

import { describe, expect, it } from 'vitest';

import {
  clinicPlanIncludesFeature,
  formatClinicActiveOpportunityLimit,
  getClinicActiveFillInLimit,
  getClinicActiveRoleLimit,
  getClinicCustomScreeningLimit,
  getClinicMaxLocations,
  getClinicMaxManagers,
  getClinicPlanFamily,
  getClinicPlanRank,
  getPublicClinicProBadgePlan,
  isPriorityClinicPlan,
  resolveClinicPlanFromEntitlements,
} from './billing';

describe('billing config', () => {
  it('resolves group plans over clinic plans', () => {
    expect(
      resolveClinicPlanFromEntitlements({
        clinic_starter: true,
        clinic_pro: true,
        clinic_group_starter: true,
        clinic_group_pro: true,
      }),
    ).toBe('group_pro');
    expect(
      resolveClinicPlanFromEntitlements({
        clinic_pro: true,
        clinic_group_starter: true,
      }),
    ).toBe('group_starter');
    expect(
      resolveClinicPlanFromEntitlements({ clinic_starter: true, clinic_pro: true }),
    ).toBe('pro');
    expect(resolveClinicPlanFromEntitlements({ clinic_starter: true })).toBe('starter');
    expect(resolveClinicPlanFromEntitlements({})).toBe('free');
  });

  it('ranks plans with group tiers above clinic tiers', () => {
    expect(getClinicPlanRank('group_pro')).toBeGreaterThan(getClinicPlanRank('group_starter'));
    expect(getClinicPlanRank('group_starter')).toBeGreaterThan(getClinicPlanRank('pro'));
    expect(getClinicPlanRank('pro')).toBeGreaterThan(getClinicPlanRank('starter'));
  });

  it('gates outreach and premium features by plan family', () => {
    expect(clinicPlanIncludesFeature('free', 'fill_in_outreach')).toBe(false);
    expect(clinicPlanIncludesFeature('free', 'general_candidate_messaging')).toBe(false);
    expect(clinicPlanIncludesFeature('starter', 'general_candidate_messaging')).toBe(false);
    expect(clinicPlanIncludesFeature('group_starter', 'general_candidate_messaging')).toBe(false);
    expect(clinicPlanIncludesFeature('pro', 'general_candidate_messaging')).toBe(true);
    expect(clinicPlanIncludesFeature('group_pro', 'general_candidate_messaging')).toBe(true);
    expect(clinicPlanIncludesFeature('starter', 'fill_in_sms')).toBe(true);
    expect(clinicPlanIncludesFeature('group_starter', 'screening_questions')).toBe(true);
    expect(clinicPlanIncludesFeature('group_starter', 'priority_listing')).toBe(false);
    expect(clinicPlanIncludesFeature('pro', 'priority_listing')).toBe(true);
    expect(clinicPlanIncludesFeature('group_pro', 'hiring_insights')).toBe(true);
    expect(clinicPlanIncludesFeature('starter', 'bulk_outreach')).toBe(false);
    expect(isPriorityClinicPlan('group_pro')).toBe(true);
    expect(isPriorityClinicPlan('pro')).toBe(true);
    expect(isPriorityClinicPlan('starter')).toBe(false);
    expect(getPublicClinicProBadgePlan('pro')).toBe('pro');
    expect(getPublicClinicProBadgePlan('group_pro')).toBe('group_pro');
    expect(getPublicClinicProBadgePlan('starter')).toBeNull();
  });

  it('formats opportunity limits for starter at 5 and pro unlimited', () => {
    expect(formatClinicActiveOpportunityLimit('free')).toBe('1');
    expect(formatClinicActiveOpportunityLimit('starter')).toBe('5');
    expect(formatClinicActiveOpportunityLimit('group_starter')).toBe('5');
    expect(formatClinicActiveOpportunityLimit('pro')).toBe('Unlimited');
    expect(getClinicActiveRoleLimit('starter')).toBe(5);
    expect(getClinicActiveFillInLimit('group_pro')).toBeNull();
  });

  it('applies free group trial location and manager caps', () => {
    expect(getClinicMaxLocations('free', 'individual')).toBe(1);
    expect(getClinicMaxLocations('free', 'group')).toBe(2);
    expect(getClinicMaxLocations('starter', 'individual')).toBe(1);
    expect(getClinicMaxLocations('group_starter')).toBe(5);
    expect(getClinicMaxLocations('group_pro')).toBeNull();

    expect(getClinicMaxManagers('free', 'individual')).toBe(0);
    expect(getClinicMaxManagers('free', 'group')).toBe(1);
    expect(getClinicMaxManagers('group_starter')).toBe(3);
    expect(getClinicMaxManagers('group_pro')).toBeNull();
    expect(getClinicMaxManagers('pro', 'individual')).toBe(0);
  });

  it('caps custom screening on starter tiers', () => {
    expect(getClinicCustomScreeningLimit('free')).toBe(0);
    expect(getClinicCustomScreeningLimit('starter')).toBe(5);
    expect(getClinicCustomScreeningLimit('group_starter')).toBe(5);
    expect(getClinicCustomScreeningLimit('pro')).toBeNull();
    expect(getClinicPlanFamily('group_starter')).toBe('group');
    expect(getClinicPlanFamily('pro')).toBe('clinic');
  });
});

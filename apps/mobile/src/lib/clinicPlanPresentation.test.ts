import { describe, expect, it } from 'vitest';

import {
  formatBillingCycleLabel,
  formatBillingDate,
  formatClinicSubscriptionStatus,
  formatNextChargeLabel,
  getClinicPlanBrandAccentColor,
  getClinicPlanFeatureAccentColor,
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  getSubscriptionFacts,
  getSubscriptionManagementHistoryHint,
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

  it('uses purple accents for pro plan branding', () => {
    const colors = { primary: '#1A6FD4', secondary: '#5856D6', success: '#34C759' };
    expect(getClinicPlanBrandAccentColor('pro', colors)).toBe('#5856D6');
    expect(getClinicPlanBrandAccentColor('starter', colors)).toBe('#1A6FD4');
    expect(getClinicPlanBrandAccentColor('free', colors)).toBe('#34C759');
    expect(getClinicPlanFeatureAccentColor('pro', colors, false)).toBe('#5856D6');
    expect(getClinicPlanFeatureAccentColor('starter', colors, true)).toBe('#1A6FD4');
    expect(getClinicPlanFeatureAccentColor('free', colors, false)).toBe('#34C759');
  });
});

describe('clinicPlanPresentation subscription copy', () => {
  it('formats renewing vs cancelled status lines', () => {
    expect(formatClinicSubscriptionStatus('active', '2027-03-01T12:00:00.000Z')).toMatch(
      /^Renews /,
    );
    expect(formatClinicSubscriptionStatus('cancelled', '2027-03-01T12:00:00.000Z')).toMatch(
      /^Access until /,
    );
    expect(formatClinicSubscriptionStatus('grace_period', null)).toContain('Manage subscription');
  });

  it('formats billing cycle and next charge labels', () => {
    expect(formatBillingCycleLabel('monthly')).toBe('Monthly');
    expect(formatBillingCycleLabel('yearly')).toBe('Yearly');

    expect(
      formatNextChargeLabel('active', 'CA$49', '2027-03-01T12:00:00.000Z'),
    ).toMatch(/^Next charge CA\$49 on /);
    expect(formatNextChargeLabel('cancelled', 'CA$49', '2027-03-01T12:00:00.000Z')).toBeNull();
    expect(formatNextChargeLabel('active', null, '2027-03-01T12:00:00.000Z')).toBeNull();
  });

  it('builds subscription fact rows without repeating the renewal date', () => {
    expect(
      getSubscriptionFacts({
        status: 'active',
        currentPeriodEnd: '2027-03-01T12:00:00.000Z',
        billingCycle: 'monthly',
        priceLabel: 'CA$99.99',
      }),
    ).toEqual([
      { label: 'Billing cycle', value: 'Monthly' },
      { label: 'Renews', value: formatBillingDate('2027-03-01T12:00:00.000Z') },
      { label: 'Next charge', value: 'CA$99.99' },
    ]);

    expect(
      getSubscriptionFacts({
        status: 'cancelled',
        currentPeriodEnd: '2027-03-01T12:00:00.000Z',
        billingCycle: 'yearly',
        priceLabel: 'CA$499',
      }),
    ).toEqual([
      { label: 'Billing cycle', value: 'Yearly' },
      { label: 'Access until', value: formatBillingDate('2027-03-01T12:00:00.000Z') },
    ]);
  });

  it('formats manage-subscription history hints by platform', () => {
    expect(getSubscriptionManagementHistoryHint('web')).toContain('billing portal');
    expect(getSubscriptionManagementHistoryHint('native')).toContain('App Store');
  });
});

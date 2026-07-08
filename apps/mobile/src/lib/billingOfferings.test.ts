import { describe, expect, it } from 'vitest';

import {
  computeYearlySavings,
  findBillingPackage,
  formatBillingPackagePrice,
  formatYearlySavingsBadge,
  formatYearlySavingsDetail,
  formatYearlySavingsLabel,
  normalizeWebBillingPriceAmount,
  resolveBillingPackageMeta,
  type BillingOfferings,
} from './billingOfferings';

describe('billingOfferings', () => {
  it('resolves starter and pro package metadata from identifiers', () => {
    expect(resolveBillingPackageMeta(['clinic_starter_monthly'])).toEqual({
      plan: 'starter',
      billingCycle: 'monthly',
    });
    expect(resolveBillingPackageMeta(['clinic_pro_yearly'])).toEqual({
      plan: 'pro',
      billingCycle: 'yearly',
    });
    expect(resolveBillingPackageMeta(['$rc_monthly'])).toEqual({
      plan: 'starter',
      billingCycle: 'monthly',
    });
    expect(resolveBillingPackageMeta(['$rc_monthly_pro', 'clinic_pro_monthly'])).toEqual({
      plan: 'pro',
      billingCycle: 'monthly',
    });
    expect(resolveBillingPackageMeta(['$rc_annual_pro', 'clinic_pro_yearly'])).toEqual({
      plan: 'pro',
      billingCycle: 'yearly',
    });
    expect(resolveBillingPackageMeta(['$rc_annual_pro'])).toEqual({
      plan: 'pro',
      billingCycle: 'yearly',
    });
    expect(resolveBillingPackageMeta(['$rc_monthly_pro'])).not.toEqual({
      plan: 'starter',
      billingCycle: 'monthly',
    });
  });

  it('finds packages by plan and billing cycle', () => {
    const offerings: BillingOfferings = {
      packages: [
        {
          identifier: 'starter_monthly',
          productIdentifier: 'clinic_starter_monthly',
          priceLabel: '$49',
          priceAmount: 49,
          currencyCode: 'CAD',
          billingCycle: 'monthly',
          plan: 'starter',
          source: {},
        },
      ],
    };

    expect(findBillingPackage(offerings, 'starter', 'monthly')?.priceLabel).toBe('$49');
    expect(findBillingPackage(offerings, 'pro', 'monthly')).toBeUndefined();
  });

  it('formats yearly savings from monthly and yearly package prices', () => {
    const monthly = {
      identifier: 'starter_monthly',
      productIdentifier: 'clinic_starter_monthly',
      priceLabel: 'CA$29.99',
      priceAmount: 29.99,
      currencyCode: 'CAD',
      billingCycle: 'monthly' as const,
      plan: 'starter' as const,
      source: {},
    };
    const yearly = {
      identifier: 'starter_yearly',
      productIdentifier: 'clinic_starter_yearly',
      priceLabel: 'CA$289.99',
      priceAmount: 289.99,
      currencyCode: 'CAD',
      billingCycle: 'yearly' as const,
      plan: 'starter' as const,
      source: {},
    };

    const savings = computeYearlySavings(monthly, yearly);
    expect(savings?.percent).toBe(19);
    expect(savings?.formattedAmount).toBe('CA$69.89');
    expect(formatYearlySavingsBadge(savings!)).toBe('Save 19%');
    expect(formatYearlySavingsDetail(savings!)).toBe('CA$69.89 less than paying monthly');
    expect(formatYearlySavingsLabel(monthly, yearly)).toBe(
      'Save 19% · CA$69.89 less than paying monthly',
    );
  });

  it('normalizes web minor-unit prices when computing savings', () => {
    expect(normalizeWebBillingPriceAmount({ amount: 2999 })).toBe(29.99);
    expect(normalizeWebBillingPriceAmount({ amount: 0, amountMicros: 289_990_000 })).toBe(289.99);

    const monthly = {
      identifier: 'starter_monthly',
      productIdentifier: 'clinic_starter_monthly',
      priceLabel: 'CA$29.99',
      priceAmount: normalizeWebBillingPriceAmount({ amount: 2999 }),
      currencyCode: 'CAD',
      billingCycle: 'monthly' as const,
      plan: 'starter' as const,
      source: {},
    };
    const yearly = {
      identifier: 'starter_yearly',
      productIdentifier: 'clinic_starter_yearly',
      priceLabel: 'CA$289.99',
      priceAmount: normalizeWebBillingPriceAmount({ amount: 28999 }),
      currencyCode: 'CAD',
      billingCycle: 'yearly' as const,
      plan: 'starter' as const,
      source: {},
    };

    expect(computeYearlySavings(monthly, yearly)?.percent).toBe(19);
    expect(computeYearlySavings(monthly, yearly)?.formattedAmount).toBe('CA$69.89');
  });
});

import {
  REVENUECAT_ENTITLEMENT_GROUP_PRO,
  REVENUECAT_ENTITLEMENT_GROUP_STARTER,
  REVENUECAT_ENTITLEMENT_PRO,
  REVENUECAT_ENTITLEMENT_STARTER,
  REVENUECAT_PACKAGE_LOOKUP,
  resolveClinicPlanFromEntitlements,
  type ClinicPlan,
} from '@chairside/config';

export type BillingCycle = 'monthly' | 'yearly';
export type BillingPlan = 'starter' | 'pro' | 'group_starter' | 'group_pro';

export type BillingPackage = {
  identifier: string;
  productIdentifier: string;
  priceLabel: string;
  /** Store price amount in major currency units (e.g. dollars, not cents). */
  priceAmount: number | null;
  currencyCode: string | null;
  billingCycle: BillingCycle;
  plan: BillingPlan;
  /** Platform-specific package object passed to purchaseBillingPackage. */
  source: unknown;
};

export type BillingOfferings = {
  packages: BillingPackage[];
};

function matchesLookup(identifiers: string[], candidates: readonly string[]): boolean {
  const normalized = new Set(identifiers.map((id) => id.toLowerCase()));
  return candidates.some((candidate) => normalized.has(candidate.toLowerCase()));
}

export function resolveBillingPackageMeta(
  identifiers: string[],
): { plan: BillingPlan; billingCycle: BillingCycle } | null {
  // Resolve higher tiers first so RevenueCat package IDs never collide
  // (e.g. $rc_monthly_pro vs $rc_monthly).
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.groupProMonthly)) {
    return { plan: 'group_pro', billingCycle: 'monthly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.groupProYearly)) {
    return { plan: 'group_pro', billingCycle: 'yearly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.groupStarterMonthly)) {
    return { plan: 'group_starter', billingCycle: 'monthly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.groupStarterYearly)) {
    return { plan: 'group_starter', billingCycle: 'yearly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.proMonthly)) {
    return { plan: 'pro', billingCycle: 'monthly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.proYearly)) {
    return { plan: 'pro', billingCycle: 'yearly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.starterMonthly)) {
    return { plan: 'starter', billingCycle: 'monthly' };
  }
  if (matchesLookup(identifiers, REVENUECAT_PACKAGE_LOOKUP.starterYearly)) {
    return { plan: 'starter', billingCycle: 'yearly' };
  }
  return null;
}

export function findBillingPackage(
  offerings: BillingOfferings | null | undefined,
  plan: BillingPlan,
  billingCycle: BillingCycle,
): BillingPackage | undefined {
  return offerings?.packages.find(
    (pkg) => pkg.plan === plan && pkg.billingCycle === billingCycle,
  );
}

export function formatBillingPackagePrice(
  pkg: BillingPackage | undefined,
  billingCycle: BillingCycle,
): string | null {
  if (!pkg) return null;
  const suffix = billingCycle === 'monthly' ? '/mo' : '/yr';
  return `${pkg.priceLabel}${suffix}`;
}

export function normalizeWebBillingPriceAmount(price: {
  amount: number;
  amountMicros?: number;
}): number | null {
  if (Number.isFinite(price.amountMicros) && price.amountMicros > 0) {
    return price.amountMicros / 1_000_000;
  }

  if (Number.isFinite(price.amount) && price.amount > 0) {
    return price.amount / 100;
  }

  return null;
}

export type YearlySavings = {
  amount: number;
  percent: number;
  formattedAmount: string;
};

export function computeYearlySavings(
  monthlyPackage: BillingPackage | undefined,
  yearlyPackage: BillingPackage | undefined,
): YearlySavings | null {
  const monthlyAmount = monthlyPackage?.priceAmount;
  const yearlyAmount = yearlyPackage?.priceAmount;
  if (monthlyAmount == null || yearlyAmount == null || monthlyAmount <= 0) return null;

  const annualizedMonthly = monthlyAmount * 12;
  const savingsAmount = annualizedMonthly - yearlyAmount;
  if (savingsAmount <= 0) return null;

  const savingsPercent = Math.round((savingsAmount / annualizedMonthly) * 100);
  if (savingsPercent <= 0) return null;

  const currencyCode = yearlyPackage?.currencyCode ?? monthlyPackage?.currencyCode ?? 'CAD';
  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(savingsAmount);

  return {
    amount: savingsAmount,
    percent: savingsPercent,
    formattedAmount,
  };
}

export function formatYearlySavingsBadge(savings: YearlySavings): string {
  return `Save ${savings.percent}%`;
}

export function formatYearlySavingsDetail(savings: YearlySavings): string {
  return `${savings.formattedAmount} less than paying monthly`;
}

/** @deprecated Use computeYearlySavings + formatYearlySavingsDetail instead. */
export function formatYearlySavingsLabel(
  monthlyPackage: BillingPackage | undefined,
  yearlyPackage: BillingPackage | undefined,
): string | null {
  const savings = computeYearlySavings(monthlyPackage, yearlyPackage);
  if (!savings) return null;
  return `${formatYearlySavingsBadge(savings)} · ${formatYearlySavingsDetail(savings)}`;
}

export function getClinicPlanFromEntitlements(
  activeEntitlements: Record<string, unknown>,
): ClinicPlan {
  return resolveClinicPlanFromEntitlements({
    clinic_group_pro: Boolean(activeEntitlements[REVENUECAT_ENTITLEMENT_GROUP_PRO]),
    clinic_group_starter: Boolean(activeEntitlements[REVENUECAT_ENTITLEMENT_GROUP_STARTER]),
    clinic_pro: Boolean(activeEntitlements[REVENUECAT_ENTITLEMENT_PRO]),
    clinic_starter: Boolean(activeEntitlements[REVENUECAT_ENTITLEMENT_STARTER]),
  });
}

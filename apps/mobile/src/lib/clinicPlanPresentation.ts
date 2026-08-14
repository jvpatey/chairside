import {
  CLINIC_PLAN_LABELS,
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import type { ClinicBillingState, ClinicSubscriptionStatus } from '@chairside/api';
import type { Ionicons } from '@expo/vector-icons';

export const CLINIC_PLAN_ICONS: Record<ClinicPlan, keyof typeof Ionicons.glyphMap> = {
  free: 'leaf-outline',
  starter: 'rocket-outline',
  pro: 'diamond-outline',
  group_starter: 'business-outline',
  group_pro: 'diamond-outline',
};

export function getClinicPlanHeroSummary(plan: ClinicPlan): string {
  return CLINIC_PLAN_MARKETING[plan].tagline;
}

export function getClinicPlanLimitSummary(plan: ClinicPlan): string {
  switch (plan) {
    case 'free':
      return '1 active role and 1 active fill-in';
    case 'starter':
      return 'Up to 5 active roles and fill-ins';
    case 'pro':
      return 'Unlimited active opportunities';
    case 'group_starter':
      return 'Up to 5 locations, 3 managers, and 5+5 posts';
    case 'group_pro':
      return 'Unlimited locations, managers, and postings';
  }
}

export function formatClinicSubscriptionStatus(
  status: ClinicSubscriptionStatus,
  currentPeriodEnd: string | null | undefined,
): string | null {
  if (status === 'cancelled' && currentPeriodEnd) {
    return `Access until ${formatBillingDate(currentPeriodEnd)}`;
  }
  if (status === 'grace_period') {
    return 'Payment issue — open Manage subscription to update billing and keep access';
  }
  if (status === 'expired') {
    return 'Subscription expired';
  }
  if (currentPeriodEnd && planHasPaidRenewal(status)) {
    return `Renews ${formatBillingDate(currentPeriodEnd)}`;
  }
  return null;
}

export function formatBillingCycleLabel(cycle: 'monthly' | 'yearly'): string {
  return cycle === 'monthly' ? 'Monthly' : 'Yearly';
}

export function formatNextChargeLabel(
  status: ClinicSubscriptionStatus,
  priceLabel: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
): string | null {
  if ((status !== 'active' && status !== 'trialing') || !priceLabel || !currentPeriodEnd) {
    return null;
  }
  return `Next charge ${priceLabel} on ${formatBillingDate(currentPeriodEnd)}`;
}

export type SubscriptionFact = {
  label: string;
  value: string;
};

/** Label/value rows for the billing hero fact grid (cycle, renews/access, next charge). */
export function getSubscriptionFacts(input: {
  status: ClinicSubscriptionStatus;
  currentPeriodEnd?: string | null;
  billingCycle?: 'monthly' | 'yearly' | null;
  priceLabel?: string | null;
}): SubscriptionFact[] {
  const facts: SubscriptionFact[] = [];

  if (input.billingCycle) {
    facts.push({
      label: 'Billing cycle',
      value: formatBillingCycleLabel(input.billingCycle),
    });
  }

  if (input.status === 'cancelled' && input.currentPeriodEnd) {
    facts.push({ label: 'Access until', value: formatBillingDate(input.currentPeriodEnd) });
  } else if (input.status === 'expired') {
    facts.push({ label: 'Status', value: 'Expired' });
  } else if (
    input.currentPeriodEnd &&
    (input.status === 'active' || input.status === 'trialing' || input.status === 'grace_period')
  ) {
    facts.push({ label: 'Renews', value: formatBillingDate(input.currentPeriodEnd) });
  }

  if ((input.status === 'active' || input.status === 'trialing') && input.priceLabel) {
    facts.push({ label: 'Next charge', value: input.priceLabel });
  }

  return facts;
}

export function getSubscriptionWarning(status: ClinicSubscriptionStatus): string | null {
  if (status === 'grace_period') {
    return 'Payment issue — open Manage subscription to update billing and keep access';
  }
  return null;
}

export function getSubscriptionManagementHistoryHint(platform: 'web' | 'native'): string {
  return platform === 'web'
    ? 'Invoices and payment history are in your billing portal.'
    : 'Invoices and payment history are in your App Store subscriptions.';
}

function planHasPaidRenewal(status: ClinicSubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing' || status === 'cancelled';
}

export function formatBillingDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getClinicPlanTierLabel(plan: ClinicPlan): string {
  return `${CLINIC_PLAN_LABELS[plan]} plan`;
}

export function getRecommendedUpgradePlan(
  plan: ClinicPlan,
  planFamily: 'clinic' | 'group' = 'clinic',
): ClinicPlan | null {
  if (plan === 'free') return planFamily === 'group' ? 'group_starter' : 'starter';
  if (plan === 'starter') return 'pro';
  if (plan === 'group_starter') return 'group_pro';
  return null;
}

export type ClinicPostingPublishType = 'role' | 'fill-in';

export function isRolePostingLimitReached(
  billing: Pick<ClinicBillingState, 'canPublishRole'> | null | undefined,
): boolean {
  return billing != null && !billing.canPublishRole;
}

export function isFillInPostingLimitReached(
  billing: Pick<ClinicBillingState, 'canPublishFillIn'> | null | undefined,
): boolean {
  return billing != null && !billing.canPublishFillIn;
}

export function getClinicPostingLimitTitle(publishType: ClinicPostingPublishType): string {
  return publishType === 'fill-in' ? 'Fill-in limit reached' : 'Role limit reached';
}

function formatActivePostingLimit(limit: number | null): string {
  return limit == null ? 'unlimited' : String(limit);
}

function getActivePostingLabel(
  publishType: ClinicPostingPublishType,
  options: { plural?: boolean; forRemoval?: boolean } = {},
): string {
  const { plural = false, forRemoval = false } = options;

  if (publishType === 'fill-in') {
    if (forRemoval) return 'active fill-in';
    return plural ? 'active fill-ins' : 'active fill-in';
  }

  if (forRemoval) return 'active role';
  return plural ? 'active roles' : 'active role';
}

export function getClinicPostingLimitReachedMessage(
  billing: Pick<ClinicBillingState, 'plan' | 'activeRoleLimit' | 'activeFillInLimit'>,
  publishType: ClinicPostingPublishType,
): string {
  const limit =
    publishType === 'fill-in' ? billing.activeFillInLimit : billing.activeRoleLimit;
  const planLabel = CLINIC_PLAN_LABELS[billing.plan];
  const postingLabel = getActivePostingLabel(publishType, {
    plural: limit != null && limit !== 1,
  });
  const removeLabel = getActivePostingLabel(publishType, { forRemoval: true });

  if (billing.plan === 'pro' || billing.plan === 'group_pro' || limit == null) {
    return `Remove an ${removeLabel} or upgrade your plan to post more.`;
  }

  return `You have reached your ${planLabel} plan limit of ${formatActivePostingLimit(limit)} ${postingLabel}. Remove an ${removeLabel} or upgrade your plan to post more.`;
}

export function getClinicPlanBrandAccentColor(
  plan: ClinicPlan,
  colors: { primary: string; secondary: string; success: string; tertiary?: string },
): string {
  if (plan === 'pro' || plan === 'group_pro') return colors.secondary;
  if (plan === 'free') return colors.tertiary ?? colors.success;
  return colors.primary;
}

export function getClinicPlanSubtleBackground(
  plan: ClinicPlan,
  colors: {
    primarySubtle: string;
    secondarySubtle: string;
    tertiarySubtle: string;
    fillSubtle: string;
  },
): string {
  if (plan === 'pro' || plan === 'group_pro') return colors.secondarySubtle;
  if (plan === 'starter' || plan === 'group_starter') return colors.primarySubtle;
  return colors.tertiarySubtle;
}

export function getClinicPlanFeatureAccentColor(
  plan: ClinicPlan,
  colors: { primary: string; secondary: string; success: string },
  emphasized = false,
): string {
  if (plan === 'pro' || plan === 'group_pro') return colors.secondary;
  if (emphasized) return colors.primary;
  return colors.success;
}

export function formatSubscriptionStatusBadge(
  status: ClinicSubscriptionStatus,
): { label: string; tone: 'success' | 'warning' | 'muted' } {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'success' };
    case 'trialing':
      return { label: 'Trial', tone: 'success' };
    case 'grace_period':
      return { label: 'Payment issue', tone: 'warning' };
    case 'cancelled':
      return { label: 'Cancelling', tone: 'warning' };
    case 'expired':
      return { label: 'Expired', tone: 'muted' };
  }
}

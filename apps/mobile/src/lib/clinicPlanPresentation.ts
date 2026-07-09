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
};

export function getClinicPlanHeroSummary(plan: ClinicPlan): string {
  return CLINIC_PLAN_MARKETING[plan].tagline;
}

export function getClinicPlanLimitSummary(plan: ClinicPlan): string {
  switch (plan) {
    case 'free':
      return '1 active role and 1 active fill-in';
    case 'starter':
      return 'Up to 3 active roles and fill-ins';
    case 'pro':
      return 'Unlimited active opportunities';
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
    return 'Payment issue — update billing to keep access';
  }
  if (status === 'expired') {
    return 'Subscription expired';
  }
  if (currentPeriodEnd && planHasPaidRenewal(status)) {
    return `Renews ${formatBillingDate(currentPeriodEnd)}`;
  }
  return null;
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

export function getRecommendedUpgradePlan(plan: ClinicPlan): ClinicPlan | null {
  if (plan === 'free') return 'starter';
  if (plan === 'starter') return 'pro';
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

  if (billing.plan === 'pro' || limit == null) {
    return `Remove an ${removeLabel} or upgrade your plan to post more.`;
  }

  return `You have reached your ${planLabel} plan limit of ${formatActivePostingLimit(limit)} ${postingLabel}. Remove an ${removeLabel} or upgrade your plan to post more.`;
}

export function getClinicPlanBrandAccentColor(
  plan: ClinicPlan,
  colors: { primary: string; secondary: string },
): string {
  return plan === 'pro' ? colors.secondary : colors.primary;
}

export function getClinicPlanFeatureAccentColor(
  plan: ClinicPlan,
  colors: { primary: string; secondary: string; success: string },
  emphasized = false,
): string {
  if (plan === 'pro') return colors.secondary;
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

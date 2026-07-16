export type ClinicPlan = 'free' | 'starter' | 'pro';

export type ClinicBillingFeature =
  | 'publish_opportunity'
  | 'fill_in_outreach'
  | 'fill_in_sms'
  | 'priority_listing';

export const CLINIC_PLAN_LABELS: Record<ClinicPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

export type ClinicPlanMarketing = {
  tagline: string;
  fallbackPriceLabel: string;
  features: readonly string[];
};

export const CLINIC_PLAN_MARKETING: Record<ClinicPlan, ClinicPlanMarketing> = {
  free: {
    tagline: 'Try Chairside with one role and one fill-in',
    fallbackPriceLabel: 'Free forever',
    features: [
      '1 active role and 1 active fill-in',
      'Review applications and message candidates',
      'Post permanent roles and fill-in shifts',
    ],
  },
  starter: {
    tagline: 'More posts, plus outreach and SMS alerts',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Up to 3 active roles and 3 active fill-ins',
      'Direct fill-in outreach to available workers',
      'SMS fill-in alerts',
    ],
  },
  pro: {
    tagline: 'Unlimited posts with priority placement',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Unlimited active roles and fill-ins',
      'Priority role and fill-in placement',
      'Direct fill-in outreach to available workers',
      'SMS fill-in alerts',
    ],
  },
};

export const CLINIC_ACTIVE_OPPORTUNITY_LIMITS: Record<ClinicPlan, number | null> = {
  free: 1,
  starter: 3,
  pro: null,
};

export const REVENUECAT_ENTITLEMENT_STARTER = 'clinic_starter';
export const REVENUECAT_ENTITLEMENT_PRO = 'clinic_pro';

export const REVENUECAT_PRODUCT_IDS = {
  starterMonthly: 'clinic_starter_monthly',
  starterYearly: 'clinic_starter_yearly',
  proMonthly: 'clinic_pro_monthly',
  proYearly: 'clinic_pro_yearly',
} as const;

/** Package / product identifiers used when resolving offerings on native and web. */
export const REVENUECAT_PACKAGE_LOOKUP = {
  starterMonthly: [
    'starter_monthly',
    REVENUECAT_PRODUCT_IDS.starterMonthly,
    '$rc_monthly',
  ],
  starterYearly: [
    'starter_yearly',
    REVENUECAT_PRODUCT_IDS.starterYearly,
    '$rc_annual',
  ],
  proMonthly: [
    'pro_monthly',
    REVENUECAT_PRODUCT_IDS.proMonthly,
    '$rc_monthly_pro',
  ],
  proYearly: [
    'pro_yearly',
    REVENUECAT_PRODUCT_IDS.proYearly,
    '$rc_annual_pro',
  ],
} as const;

export function resolveClinicPlanFromEntitlements(entitlements: {
  clinic_starter?: boolean;
  clinic_pro?: boolean;
}): ClinicPlan {
  if (entitlements.clinic_pro) return 'pro';
  if (entitlements.clinic_starter) return 'starter';
  return 'free';
}

export function clinicPlanIncludesFeature(
  plan: ClinicPlan,
  feature: ClinicBillingFeature,
): boolean {
  switch (feature) {
    case 'publish_opportunity':
      return true;
    case 'fill_in_outreach':
    case 'fill_in_sms':
      return plan === 'starter' || plan === 'pro';
    case 'priority_listing':
      return plan === 'pro';
    default:
      return false;
  }
}

export function getClinicActiveOpportunityLimit(plan: ClinicPlan): number | null {
  return CLINIC_ACTIVE_OPPORTUNITY_LIMITS[plan];
}

export function formatClinicActiveOpportunityLimit(plan: ClinicPlan): string {
  const limit = getClinicActiveOpportunityLimit(plan);
  return limit == null ? 'Unlimited' : String(limit);
}

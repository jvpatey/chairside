export type ClinicPlan =
  | 'free'
  | 'starter'
  | 'pro'
  | 'group_starter'
  | 'group_pro';

export type ClinicPlanFamily = 'clinic' | 'group';

export type ClinicBillingFeature =
  | 'publish_opportunity'
  | 'fill_in_outreach'
  | 'fill_in_sms'
  | 'priority_listing'
  | 'screening_questions'
  | 'crm_followups'
  | 'application_pdf_export'
  | 'clinic_discover'
  | 'general_candidate_messaging'
  | 'bulk_outreach'
  | 'hiring_insights';

export const CLINIC_PLAN_LABELS: Record<ClinicPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  group_starter: 'Group Starter',
  group_pro: 'Group Pro',
};

export type ClinicPlanMarketing = {
  tagline: string;
  fallbackPriceLabel: string;
  features: readonly string[];
};

export const CLINIC_PLAN_MARKETING: Record<ClinicPlan, ClinicPlanMarketing> = {
  free: {
    tagline: 'Try Chairside with one role and one fill-in',
    fallbackPriceLabel: 'Free',
    features: [
      '1 active role and 1 active fill-in',
      'Review applications and message candidates',
      'Post permanent roles and fill-in shifts',
      'Groups: try up to 2 locations and 1 manager per location',
    ],
  },
  starter: {
    tagline: 'Active hiring for a single clinic',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Up to 5 active roles and 5 active fill-ins',
      'Screening questions, private candidate notes, and PDF export',
      'Direct fill-in outreach and SMS alerts',
      'Clinic Discover',
    ],
  },
  pro: {
    tagline: 'Unlimited hiring with priority placement',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Everything in Starter, plus:',
      'Unlimited active roles and fill-ins',
      'Priority marketplace placement and Pro badge',
      'Hiring insights and bulk fill-in outreach',
      'Unlimited custom screening questions',
      'Open inquiries — message candidates in your area, and let them reach you without applying',
    ],
  },
  group_starter: {
    tagline: 'Multi-site hiring for dental groups',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Up to 5 locations and 3 managers',
      'Up to 5 active roles and 5 fill-ins across your group',
      'Screening questions, private candidate notes, and PDF export',
      'Direct fill-in outreach and SMS alerts',
      'Clinic Discover',
    ],
  },
  group_pro: {
    tagline: 'Unlimited multi-location hiring for growing groups',
    fallbackPriceLabel: 'Billed monthly or annually',
    features: [
      'Everything in Group Starter, plus:',
      'Unlimited locations, managers, and postings',
      'Priority placement and Pro badge per location',
      'Hiring insights across your group with per-location breakdown',
      'Bulk fill-in outreach and unlimited screening',
      'Open inquiries — message candidates in your area, and let them reach you without applying',
    ],
  },
};

export function isClinicPlanFeatureIntro(feature: string): boolean {
  return feature.startsWith('Everything in ') && feature.endsWith(', plus:');
}

/** Active role limit per plan. `null` = unlimited. */
export const CLINIC_ACTIVE_ROLE_LIMITS: Record<ClinicPlan, number | null> = {
  free: 1,
  starter: 5,
  pro: null,
  group_starter: 5,
  group_pro: null,
};

/** Active fill-in limit per plan. `null` = unlimited. */
export const CLINIC_ACTIVE_FILL_IN_LIMITS: Record<ClinicPlan, number | null> = {
  free: 1,
  starter: 5,
  pro: null,
  group_starter: 5,
  group_pro: null,
};

/** @deprecated Prefer CLINIC_ACTIVE_ROLE_LIMITS / CLINIC_ACTIVE_FILL_IN_LIMITS. */
export const CLINIC_ACTIVE_OPPORTUNITY_LIMITS: Record<ClinicPlan, number | null> =
  CLINIC_ACTIVE_ROLE_LIMITS;

/** Max locations. Free group trial uses account_type=group → 2. */
export const CLINIC_MAX_LOCATIONS: Record<ClinicPlan, number | null> = {
  free: 1,
  starter: 1,
  pro: 1,
  group_starter: 5,
  group_pro: null,
};

export const CLINIC_FREE_GROUP_MAX_LOCATIONS = 2;

/** Free groups: one manager seat per free location slot. */
export const CLINIC_FREE_GROUP_MAX_MANAGERS = CLINIC_FREE_GROUP_MAX_LOCATIONS;

/** Max managers (excluding owner). Clinic plans = 0. */
export const CLINIC_MAX_MANAGERS: Record<ClinicPlan, number | null> = {
  free: CLINIC_FREE_GROUP_MAX_MANAGERS,
  starter: 0,
  pro: 0,
  group_starter: 3,
  group_pro: null,
};

/** Custom screening questions. `null` = unlimited. Free = 0. */
export const CLINIC_CUSTOM_SCREENING_LIMITS: Record<ClinicPlan, number | null> = {
  free: 0,
  starter: 5,
  pro: null,
  group_starter: 5,
  group_pro: null,
};

/** Max workers a clinic can include in one bulk fill-in outreach send. */
export const FILL_IN_BULK_OUTREACH_MAX = 25;

export const REVENUECAT_ENTITLEMENT_STARTER = 'clinic_starter';
export const REVENUECAT_ENTITLEMENT_PRO = 'clinic_pro';
export const REVENUECAT_ENTITLEMENT_GROUP_STARTER = 'clinic_group_starter';
export const REVENUECAT_ENTITLEMENT_GROUP_PRO = 'clinic_group_pro';

export const REVENUECAT_PRODUCT_IDS = {
  starterMonthly: 'clinic_starter_monthly_v2',
  starterYearly: 'clinic_starter_yearly_v2',
  proMonthly: 'clinic_pro_monthly_v2',
  proYearly: 'clinic_pro_yearly_v2',
  groupStarterMonthly: 'group_starter_monthly',
  groupStarterYearly: 'group_starter_yearly_v2',
  groupProMonthly: 'group_pro_monthly',
  groupProYearly: 'group_pro_yearly',
} as const;

/** Package / product identifiers used when resolving offerings on native and web. */
export const REVENUECAT_PACKAGE_LOOKUP = {
  starterMonthly: [
    'starter_monthly',
    REVENUECAT_PRODUCT_IDS.starterMonthly,
    'clinic_starter_monthly', // retired ASC product ID
    '$rc_monthly',
  ],
  starterYearly: [
    'starter_yearly',
    REVENUECAT_PRODUCT_IDS.starterYearly,
    'clinic_starter_yearly', // retired ASC product ID
    '$rc_annual',
  ],
  proMonthly: [
    'pro_monthly',
    REVENUECAT_PRODUCT_IDS.proMonthly,
    'clinic_pro_monthly', // retired ASC product ID
    '$rc_monthly_pro',
  ],
  proYearly: [
    'pro_yearly',
    REVENUECAT_PRODUCT_IDS.proYearly,
    'clinic_pro_yearly', // retired ASC product ID
    '$rc_annual_pro',
  ],
  groupStarterMonthly: [
    'group_starter_monthly',
    REVENUECAT_PRODUCT_IDS.groupStarterMonthly,
    '$rc_monthly_group_starter',
  ],
  groupStarterYearly: [
    'group_starter_yearly_v2',
    REVENUECAT_PRODUCT_IDS.groupStarterYearly,
    'group_starter_yearly', // retired ASC product ID; keep for restore / sandbox
    '$rc_annual_group_starter',
  ],
  groupProMonthly: [
    'group_pro_monthly',
    REVENUECAT_PRODUCT_IDS.groupProMonthly,
    '$rc_monthly_group_pro',
  ],
  groupProYearly: [
    'group_pro_yearly',
    REVENUECAT_PRODUCT_IDS.groupProYearly,
    '$rc_annual_group_pro',
  ],
} as const;

export type RevenueCatEntitlementFlags = {
  clinic_starter?: boolean;
  clinic_pro?: boolean;
  clinic_group_starter?: boolean;
  clinic_group_pro?: boolean;
};

export function getClinicPlanFamily(plan: ClinicPlan): ClinicPlanFamily {
  return plan === 'group_starter' || plan === 'group_pro' ? 'group' : 'clinic';
}

export function isGroupClinicPlan(plan: ClinicPlan): boolean {
  return getClinicPlanFamily(plan) === 'group';
}

export function isPriorityClinicPlan(plan: ClinicPlan): boolean {
  return plan === 'pro' || plan === 'group_pro';
}

export function getPublicClinicProBadgePlan(
  plan: ClinicPlan | string | undefined,
): 'pro' | 'group_pro' | null {
  if (plan === 'pro' || plan === 'group_pro') return plan;
  return null;
}

export function isPaidClinicPlan(plan: ClinicPlan): boolean {
  return plan !== 'free';
}

/** Rank for selecting the highest active plan. Higher wins. */
export function getClinicPlanRank(plan: ClinicPlan): number {
  switch (plan) {
    case 'group_pro':
      return 5;
    case 'group_starter':
      return 4;
    case 'pro':
      return 3;
    case 'starter':
      return 2;
    case 'free':
    default:
      return 1;
  }
}

export function resolveClinicPlanFromEntitlements(
  entitlements: RevenueCatEntitlementFlags,
): ClinicPlan {
  if (entitlements.clinic_group_pro) return 'group_pro';
  if (entitlements.clinic_group_starter) return 'group_starter';
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
    case 'screening_questions':
    case 'crm_followups':
    case 'application_pdf_export':
    case 'clinic_discover':
      return plan === 'starter' || plan === 'pro' || plan === 'group_starter' || plan === 'group_pro';
    case 'priority_listing':
    case 'bulk_outreach':
    case 'hiring_insights':
    case 'general_candidate_messaging':
      return plan === 'pro' || plan === 'group_pro';
    default:
      return false;
  }
}

export function getClinicActiveRoleLimit(plan: ClinicPlan): number | null {
  return CLINIC_ACTIVE_ROLE_LIMITS[plan];
}

export function getClinicActiveFillInLimit(plan: ClinicPlan): number | null {
  return CLINIC_ACTIVE_FILL_IN_LIMITS[plan];
}

export function getClinicActiveOpportunityLimit(plan: ClinicPlan): number | null {
  return CLINIC_ACTIVE_ROLE_LIMITS[plan];
}

export function formatClinicActiveOpportunityLimit(plan: ClinicPlan): string {
  const limit = getClinicActiveOpportunityLimit(plan);
  return limit == null ? 'Unlimited' : String(limit);
}

export function getClinicMaxLocations(
  plan: ClinicPlan,
  accountType: 'individual' | 'group' = 'individual',
): number | null {
  if (plan === 'group_pro') return null;
  if (plan === 'group_starter') return CLINIC_MAX_LOCATIONS.group_starter;
  if (plan === 'free' && accountType === 'group') return CLINIC_FREE_GROUP_MAX_LOCATIONS;
  return CLINIC_MAX_LOCATIONS[plan];
}

export function getClinicMaxManagers(
  plan: ClinicPlan,
  accountType: 'individual' | 'group' = 'individual',
): number | null {
  if (plan === 'group_pro') return null;
  if (plan === 'group_starter') return CLINIC_MAX_MANAGERS.group_starter;
  if (plan === 'free' && accountType === 'group') return CLINIC_FREE_GROUP_MAX_MANAGERS;
  if (accountType === 'individual') return 0;
  return CLINIC_MAX_MANAGERS[plan];
}

export function getClinicCustomScreeningLimit(plan: ClinicPlan): number | null {
  return CLINIC_CUSTOM_SCREENING_LIMITS[plan];
}

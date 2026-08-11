import type { ClinicPlan, ClinicPlanFamily } from '@chairside/config';
import { isPaidClinicPlan } from '@chairside/config';
import { getSupabaseClient } from './client';
import { getErrorMessage, throwWithMessage } from './errors';

export type ClinicSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'grace_period'
  | 'cancelled'
  | 'expired';

export type ClinicBillingState = {
  plan: ClinicPlan;
  planFamily: ClinicPlanFamily;
  accountType: 'individual' | 'group';
  status: ClinicSubscriptionStatus;
  activeRoleCount: number;
  activeRoleLimit: number | null;
  activeFillInCount: number;
  activeFillInLimit: number | null;
  canPublishRole: boolean;
  canPublishFillIn: boolean;
  activeOpportunityCount: number;
  activeOpportunityLimit: number | null;
  canPublishOpportunity: boolean;
  canUseFillInOutreach: boolean;
  canUseFillInSms: boolean;
  hasPriorityListing: boolean;
  canUseScreeningQuestions: boolean;
  canUseCrmFollowups: boolean;
  canUseApplicationPdfExport: boolean;
  canUseClinicDiscover: boolean;
  canUseGeneralCandidateMessaging: boolean;
  canUseBulkOutreach: boolean;
  canUseHiringInsights: boolean;
  customScreeningLimit: number | null;
  locationCount: number;
  maxLocations: number | null;
  canAddLocation: boolean;
  managerCount: number;
  maxManagers: number | null;
  canAddManager: boolean;
  currentPeriodEnd: string | null;
};

export type ClinicSubscriptionSyncResult = {
  plan: ClinicPlan;
  status: ClinicSubscriptionStatus;
};

type ClinicBillingStateRow = {
  plan: ClinicPlan;
  plan_family?: ClinicPlanFamily;
  account_type?: 'individual' | 'group';
  status: ClinicSubscriptionStatus;
  active_role_count: number;
  active_role_limit: number | null;
  active_fill_in_count: number;
  active_fill_in_limit: number | null;
  can_publish_role: boolean;
  can_publish_fill_in: boolean;
  active_opportunity_count: number;
  active_opportunity_limit: number | null;
  can_publish_opportunity: boolean;
  can_use_fill_in_outreach: boolean;
  can_use_fill_in_sms: boolean;
  has_priority_listing: boolean;
  can_use_screening_questions?: boolean;
  can_use_crm_followups?: boolean;
  can_use_application_pdf_export?: boolean;
  can_use_clinic_discover?: boolean;
  can_use_general_candidate_messaging?: boolean;
  can_use_bulk_outreach?: boolean;
  can_use_hiring_insights?: boolean;
  custom_screening_limit?: number | null;
  location_count?: number;
  max_locations?: number | null;
  can_add_location?: boolean;
  manager_count?: number;
  max_managers?: number | null;
  can_add_manager?: boolean;
  current_period_end: string | null;
};

function mapClinicBillingState(row: ClinicBillingStateRow): ClinicBillingState {
  const plan = row.plan;
  const accountType = row.account_type ?? 'individual';
  const planFamily =
    row.plan_family ??
    (plan === 'group_starter' || plan === 'group_pro' || accountType === 'group'
      ? 'group'
      : 'clinic');

  return {
    plan,
    planFamily,
    accountType,
    status: row.status,
    activeRoleCount: row.active_role_count,
    activeRoleLimit: row.active_role_limit,
    activeFillInCount: row.active_fill_in_count,
    activeFillInLimit: row.active_fill_in_limit,
    canPublishRole: row.can_publish_role,
    canPublishFillIn: row.can_publish_fill_in,
    activeOpportunityCount: row.active_opportunity_count,
    activeOpportunityLimit: row.active_opportunity_limit,
    canPublishOpportunity: row.can_publish_opportunity,
    canUseFillInOutreach: row.can_use_fill_in_outreach,
    canUseFillInSms: row.can_use_fill_in_sms,
    hasPriorityListing: row.has_priority_listing,
    canUseScreeningQuestions: row.can_use_screening_questions ?? false,
    canUseCrmFollowups: row.can_use_crm_followups ?? false,
    canUseApplicationPdfExport: row.can_use_application_pdf_export ?? false,
    canUseClinicDiscover: row.can_use_clinic_discover ?? false,
    canUseGeneralCandidateMessaging: row.can_use_general_candidate_messaging ?? false,
    canUseBulkOutreach: row.can_use_bulk_outreach ?? false,
    canUseHiringInsights: row.can_use_hiring_insights ?? false,
    customScreeningLimit: row.custom_screening_limit ?? 0,
    locationCount: row.location_count ?? 0,
    maxLocations: row.max_locations ?? 1,
    canAddLocation: row.can_add_location ?? true,
    managerCount: row.manager_count ?? 0,
    maxManagers: row.max_managers ?? 0,
    canAddManager: row.can_add_manager ?? false,
    currentPeriodEnd: row.current_period_end,
  };
}

export function isClinicBillingLimitError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('active posting limit reached') ||
    normalized.includes('active role limit reached') ||
    normalized.includes('active fill-in limit reached') ||
    normalized.includes('direct fill-in outreach requires a paid clinic plan') ||
    normalized.includes('sms fill-in alerts require a paid clinic plan') ||
    normalized.includes('location limit reached') ||
    normalized.includes('manager limit reached') ||
    normalized.includes('screening questions require a paid clinic plan') ||
    normalized.includes('crm notes and follow-ups require a paid clinic plan') ||
    normalized.includes('application pdf export requires a paid clinic plan') ||
    normalized.includes('clinic discover requires a paid clinic plan') ||
    normalized.includes('general candidate messaging requires a paid clinic plan') ||
    normalized.includes('custom screening question limit reached') ||
    normalized.includes('hiring insights require a pro plan') ||
    normalized.includes('bulk fill-in outreach requires a pro plan')
  );
}

/** RevenueCat / Stripe already has this product for the customer. */
export function isAlreadySubscribedPurchaseError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const record = error as { errorCode?: unknown; code?: unknown; underlyingErrorMessage?: unknown };
    const code = String(record.errorCode ?? record.code ?? '').toLowerCase();
    if (
      code.includes('productalreadypurchased') ||
      code.includes('already_purchased')
    ) {
      return true;
    }
    if (
      typeof record.underlyingErrorMessage === 'string' &&
      isAlreadySubscribedPurchaseError(new Error(record.underlyingErrorMessage))
    ) {
      return true;
    }
  }

  const message = getErrorMessage(error, '').toLowerCase();
  if (!message) return false;
  return (
    message.includes('already subscribed') ||
    message.includes('already purchased') ||
    message.includes('already own') ||
    message.includes("you've already") ||
    message.includes('you already') ||
    message.includes('product already purchased') ||
    message.includes('cannot purchase product') ||
    message.includes("can't subscribe to this product again")
  );
}

export async function getClinicBillingState(
  clinicId?: string,
): Promise<ClinicBillingState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_clinic_billing_state', {
    p_clinic_id: clinicId ?? undefined,
  });

  if (error) throwWithMessage(error, 'Could not load billing state.');
  return mapClinicBillingState(data as ClinicBillingStateRow);
}

export async function getClinicPlanMap(
  clinicIds: string[],
): Promise<Map<string, ClinicPlan>> {
  if (clinicIds.length === 0) return new Map();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_clinic_plan_map', {
    p_clinic_ids: clinicIds,
  });

  if (error) throw error;

  return new Map(
    ((data ?? []) as Array<{ clinic_id: string; plan: ClinicPlan }>).map((row) => [
      row.clinic_id,
      row.plan,
    ]),
  );
}

export async function syncClinicSubscriptionFromRevenueCat(): Promise<ClinicSubscriptionSyncResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('revenuecat-sync');
  if (error) throwWithMessage(error, 'Could not sync subscription.');

  const payload = data as { plan?: ClinicPlan; status?: ClinicSubscriptionStatus; error?: string } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }
  if (!payload?.plan || !payload.status) {
    throw new Error('Could not sync subscription.');
  }

  return { plan: payload.plan, status: payload.status };
}

export { isPaidClinicPlan };

import type { ClinicPlan } from '@chairside/config';
import { getSupabaseClient } from './client';
import { throwWithMessage } from './errors';

export type ClinicSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'grace_period'
  | 'cancelled'
  | 'expired';

export type ClinicBillingState = {
  plan: ClinicPlan;
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
  currentPeriodEnd: string | null;
};

type ClinicBillingStateRow = {
  plan: ClinicPlan;
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
  current_period_end: string | null;
};

function mapClinicBillingState(row: ClinicBillingStateRow): ClinicBillingState {
  return {
    plan: row.plan,
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
    normalized.includes('sms fill-in alerts require a paid clinic plan')
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

export async function syncClinicSubscriptionFromRevenueCat(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke('revenuecat-sync');
  if (error) throwWithMessage(error, 'Could not sync subscription.');
}

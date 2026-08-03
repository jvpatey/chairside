import type { ClinicPlan, ClinicPlanFamily } from '@chairside/config';

export type ClinicUpgradeReason =
  | 'publish_role'
  | 'publish_fill_in'
  | 'outreach'
  | 'sms'
  | 'screening'
  | 'crm'
  | 'pdf_export'
  | 'discover'
  | 'general_messaging'
  | 'add_location'
  | 'add_manager';

function paidPlanLabel(planFamily: ClinicPlanFamily): string {
  return planFamily === 'group' ? 'Group Starter or Group Pro' : 'Starter or Pro';
}

export function getClinicPublishLimitMessage(
  plan: ClinicPlan,
  publishType: 'role' | 'fill-in' = 'role',
): string {
  const postingLabel = publishType === 'fill-in' ? 'fill-in' : 'role';
  const postingLabelPlural = publishType === 'fill-in' ? 'fill-ins' : 'roles';

  if (plan === 'free') {
    return `Your free plan includes 1 active ${postingLabel}. Upgrade to publish more ${postingLabelPlural}.`;
  }

  if (plan === 'starter') {
    return `Your Starter plan includes 5 active ${postingLabelPlural}. Upgrade to Pro for unlimited posting.`;
  }

  if (plan === 'group_starter') {
    return `Your Group Starter plan includes 5 active ${postingLabelPlural} org-wide. Upgrade to Group Pro for unlimited posting.`;
  }

  return 'Upgrade your plan for unlimited active roles and fill-ins.';
}

export function getClinicOutreachUpgradeMessage(
  planFamily: ClinicPlanFamily = 'clinic',
): string {
  return `Direct fill-in outreach is available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicSmsUpgradeMessage(planFamily: ClinicPlanFamily = 'clinic'): string {
  return `SMS fill-in alerts are available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicScreeningUpgradeMessage(
  planFamily: ClinicPlanFamily = 'clinic',
): string {
  return `Screening questions are available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicCrmUpgradeMessage(planFamily: ClinicPlanFamily = 'clinic'): string {
  return `CRM notes, tags, and follow-ups are available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicPdfExportUpgradeMessage(
  planFamily: ClinicPlanFamily = 'clinic',
): string {
  return `Application PDF export is available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicDiscoverUpgradeMessage(
  planFamily: ClinicPlanFamily = 'clinic',
): string {
  return `Clinic Discover is available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicGeneralMessagingUpgradeMessage(
  planFamily: ClinicPlanFamily = 'clinic',
): string {
  return `General candidate messaging is available on ${paidPlanLabel(planFamily)} plans.`;
}

export function getClinicAddLocationUpgradeMessage(
  planFamily: ClinicPlanFamily,
  maxLocations: number | null | undefined,
): string {
  if (planFamily === 'group' || maxLocations === 2) {
    return 'Your free group trial includes up to 2 locations. Upgrade to Group Starter for more locations and managers.';
  }
  return 'Single-clinic plans include one location. Upgrade to a Group plan to add more locations and invite managers.';
}

export function getClinicAddManagerUpgradeMessage(
  maxManagers: number | null | undefined,
): string {
  if (maxManagers === 1) {
    return 'Your free group trial includes 1 manager. Upgrade to Group Starter for more managers and locations.';
  }
  if (maxManagers === 0) {
    return 'Manager invites require a Group plan. Upgrade to Group Starter to invite managers.';
  }
  return 'You have reached your manager limit. Upgrade your Group plan to invite more managers.';
}

export function getClinicUpgradePromptTitle(reason: ClinicUpgradeReason): string {
  switch (reason) {
    case 'outreach':
      return 'Upgrade for outreach';
    case 'sms':
      return 'Upgrade for SMS alerts';
    case 'screening':
      return 'Upgrade for screening';
    case 'crm':
      return 'Upgrade for CRM';
    case 'pdf_export':
      return 'Upgrade for PDF export';
    case 'discover':
      return 'Upgrade for Discover';
    case 'general_messaging':
      return 'Upgrade for messaging';
    case 'add_location':
      return 'Upgrade to add locations';
    case 'add_manager':
      return 'Upgrade to invite managers';
    case 'publish_role':
    case 'publish_fill_in':
      return 'Upgrade to publish more';
  }
}

export function getClinicUpgradePromptMessage(
  reason: ClinicUpgradeReason,
  options: {
    plan: ClinicPlan;
    planFamily: ClinicPlanFamily;
    maxLocations?: number | null;
    maxManagers?: number | null;
  },
): string {
  const { plan, planFamily, maxLocations, maxManagers } = options;
  switch (reason) {
    case 'outreach':
      return getClinicOutreachUpgradeMessage(planFamily);
    case 'sms':
      return getClinicSmsUpgradeMessage(planFamily);
    case 'screening':
      return getClinicScreeningUpgradeMessage(planFamily);
    case 'crm':
      return getClinicCrmUpgradeMessage(planFamily);
    case 'pdf_export':
      return getClinicPdfExportUpgradeMessage(planFamily);
    case 'discover':
      return getClinicDiscoverUpgradeMessage(planFamily);
    case 'general_messaging':
      return getClinicGeneralMessagingUpgradeMessage(planFamily);
    case 'add_location':
      return getClinicAddLocationUpgradeMessage(planFamily, maxLocations);
    case 'add_manager':
      return getClinicAddManagerUpgradeMessage(maxManagers);
    case 'publish_fill_in':
      return getClinicPublishLimitMessage(plan, 'fill-in');
    case 'publish_role':
      return getClinicPublishLimitMessage(plan, 'role');
  }
}

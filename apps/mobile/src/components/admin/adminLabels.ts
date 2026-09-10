import { getRoleTypeLabel } from '@chairside/config';

import type { Colors } from '@/theme';
import { colorWithAlpha } from '@/theme';

export function formatAdminRoleLabel(role: string): string {
  if (role === 'unknown') return 'Unspecified';
  return getRoleTypeLabel(role);
}

export function formatAdminPlanLabel(plan: string): string {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'starter':
      return 'Starter';
    case 'pro':
      return 'Pro';
    case 'group_starter':
      return 'Group Starter';
    case 'group_pro':
      return 'Group Pro';
    default:
      return plan.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatAdminStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trialing';
    case 'grace_period':
      return 'Grace period';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatAdminAccountType(accountType: string): string {
  return accountType === 'group' ? 'Group' : 'Individual';
}

export function getPlanAccent(plan: string, colors: Colors): { bg: string; fg: string; bar: string } {
  switch (plan) {
    case 'starter':
      return { bg: colors.primarySubtle, fg: colors.primary, bar: colors.primary };
    case 'pro':
      return { bg: colors.secondarySubtle, fg: colors.secondary, bar: colors.secondary };
    case 'group_starter':
      return { bg: colors.tertiarySubtle, fg: colors.tertiary, bar: colors.tertiary };
    case 'group_pro':
      return {
        bg: colorWithAlpha(colors.info, 0.14),
        fg: colors.info,
        bar: colors.info,
      };
    case 'free':
    default:
      return { bg: colors.fillSubtle, fg: colors.labelSecondary, bar: colors.labelTertiary };
  }
}

export function getStatusAccent(status: string, colors: Colors): { bg: string; fg: string } {
  switch (status) {
    case 'active':
      return { bg: colors.tertiarySubtle, fg: colors.tertiary };
    case 'trialing':
      return { bg: colors.primarySubtle, fg: colors.primary };
    case 'grace_period':
      return { bg: colorWithAlpha(colors.warning, 0.14), fg: colors.warning };
    case 'cancelled':
      return { bg: colors.fillSubtle, fg: colors.labelSecondary };
    case 'expired':
      return { bg: colorWithAlpha(colors.destructive, 0.12), fg: colors.destructive };
    default:
      return { bg: colors.fillSubtle, fg: colors.labelSecondary };
  }
}

const ROLE_BAR_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'warning',
  'info',
  'success',
] as const;

export function getRoleBarColor(index: number, colors: Colors): string {
  const key = ROLE_BAR_COLORS[index % ROLE_BAR_COLORS.length];
  return colors[key];
}

export function formatAdminRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatAdminPeriodEnd(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

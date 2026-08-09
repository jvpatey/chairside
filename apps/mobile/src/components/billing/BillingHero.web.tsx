import type { ClinicBillingState } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BillingMetricTile } from '@/components/billing/BillingMetricTile';
import { PillBadge } from '@/components/ui/PillBadge';
import { getClinicPlanLabel } from '@/contexts/ClinicBillingContext';
import {
  CLINIC_PLAN_ICONS,
  formatClinicSubscriptionStatus,
  formatSubscriptionStatusBadge,
  getClinicPlanBrandAccentColor,
  getClinicPlanHeroSummary,
  getClinicPlanSubtleBackground,
} from '@/lib/clinicPlanPresentation';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';

type BillingHeroProps = {
  billing: ClinicBillingState;
  canManageSubscription: boolean;
  isManagingSubscription: boolean;
  isPurchaseBillingAvailable: boolean;
  recommendedUpgradeLabel?: string | null;
  isPurchasing?: boolean;
  onManageSubscription?: () => void;
  onUpgrade?: () => void;
  onComparePlans?: () => void;
  compact?: boolean;
};

function formatMetricValue(active: number, limit: number | null | undefined): string {
  if (limit == null) return `${active}`;
  return `${active}/${limit}`;
}

function formatMetricHint(active: number, limit: number | null | undefined): string | null {
  if (limit == null) return 'No limit';
  const remaining = limit - active;
  if (remaining <= 0) return 'At limit';
  return `${remaining} left`;
}

/** Web billing hero — flat plan card with usage metrics. */
export function BillingHero({ billing }: BillingHeroProps) {
  const { colors, isDark } = useTheme();
  const plan = billing.plan;
  const planLabel = getClinicPlanLabel(plan);
  const brandAccent = getClinicPlanBrandAccentColor(plan, colors);
  const statusBadge =
    plan !== 'free' ? formatSubscriptionStatusBadge(billing.status) : null;
  const renewalLabel = formatClinicSubscriptionStatus(billing.status, billing.currentPeriodEnd);

  const statusColor =
    statusBadge?.tone === 'success'
      ? colors.success
      : statusBadge?.tone === 'warning'
        ? colors.warning
        : colors.labelTertiary;

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    card: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      flexWrap: 'wrap' as const,
      // @ts-expect-error web shadow
      boxShadow: getWebShadow(isDark, 'subtle'),
    },
    identity: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      flex: 1,
      minWidth: 240,
    },
    motif: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      backgroundColor: getClinicPlanSubtleBackground(plan, colors),
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    eyebrow: {
      ...webTypography.eyebrow,
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.labelTertiary,
    },
    planName: {
      ...webTypography.title,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.5,
      color: colors.labelPrimary,
    },
    summary: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    metaRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginTop: 2,
    },
    renewal: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
    },
    metricsRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      flexShrink: 0,
      minWidth: 280,
      maxWidth: 380,
      flexGrow: 1,
      alignItems: 'stretch' as const,
    },
  }));

  const roleAtLimit =
    billing.activeRoleLimit != null && billing.activeRoleCount >= billing.activeRoleLimit;
  const fillInAtLimit =
    billing.activeFillInLimit != null && billing.activeFillInCount >= billing.activeFillInLimit;

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <View style={styles.motif}>
          <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={26} color={brandAccent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Current plan</Text>
          <Text style={styles.planName}>{planLabel}</Text>
          <Text style={styles.summary}>{getClinicPlanHeroSummary(plan)}</Text>
          {statusBadge || renewalLabel ? (
            <View style={styles.metaRow}>
              {statusBadge ? (
                <PillBadge
                  label={statusBadge.label}
                  color={statusColor}
                  backgroundColor={colorWithAlpha(statusColor, isDark ? 0.18 : 0.1)}
                  borderColor={colorWithAlpha(statusColor, 0.28)}
                  size="sm"
                />
              ) : null}
              {renewalLabel ? <Text style={styles.renewal}>{renewalLabel}</Text> : null}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <BillingMetricTile
          label="Active roles"
          value={formatMetricValue(billing.activeRoleCount, billing.activeRoleLimit)}
          hint={formatMetricHint(billing.activeRoleCount, billing.activeRoleLimit)}
          atLimit={roleAtLimit}
          accent={colors.primary}
          icon="briefcase-outline"
        />
        <BillingMetricTile
          label="Active fill-ins"
          value={formatMetricValue(billing.activeFillInCount, billing.activeFillInLimit)}
          hint={formatMetricHint(billing.activeFillInCount, billing.activeFillInLimit)}
          atLimit={fillInAtLimit}
          accent={colors.secondary}
          icon={FILL_IN_ICON.outline}
        />
      </View>
    </View>
  );
}

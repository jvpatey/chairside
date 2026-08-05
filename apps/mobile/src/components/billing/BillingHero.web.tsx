import type { ClinicBillingState } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
} from '@/lib/clinicPlanPresentation';
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

function planHeroWash(plan: ClinicBillingState['plan'], isDark: boolean): [string, string] {
  if (plan === 'free') {
    return isDark
      ? ['rgba(48, 209, 88, 0.22)', 'rgba(28, 28, 30, 0.94)']
      : ['rgba(52, 199, 89, 0.16)', 'rgba(255, 255, 255, 0.95)'];
  }
  if (plan === 'pro' || plan === 'group_pro') {
    return isDark
      ? ['rgba(152, 150, 255, 0.24)', 'rgba(28, 28, 30, 0.94)']
      : ['rgba(88, 86, 214, 0.16)', 'rgba(255, 255, 255, 0.95)'];
  }
  return isDark
    ? ['rgba(74, 154, 255, 0.22)', 'rgba(28, 28, 30, 0.94)']
    : ['rgba(26, 111, 212, 0.14)', 'rgba(255, 255, 255, 0.95)'];
}

/** Web billing hero — plan-tinted card with usage metrics. */
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
      borderRadius: radii.xl,
      borderWidth: 2,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      // @ts-expect-error web shadow
      boxShadow: getWebShadow(isDark, 'subtle'),
      flexWrap: 'wrap' as const,
    },
    wash: {
      ...StyleSheet.absoluteFillObject,
    },
    identity: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      flex: 1,
      minWidth: 240,
      zIndex: 1,
    },
    motif: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      borderWidth: 1,
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
      zIndex: 1,
      alignItems: 'stretch' as const,
    },
  }));

  const roleAtLimit =
    billing.activeRoleLimit != null && billing.activeRoleCount >= billing.activeRoleLimit;
  const fillInAtLimit =
    billing.activeFillInLimit != null && billing.activeFillInCount >= billing.activeFillInLimit;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colorWithAlpha(brandAccent, isDark ? 0.12 : 0.06),
          borderColor: colorWithAlpha(brandAccent, isDark ? 0.42 : 0.28),
        },
      ]}>
      <LinearGradient
        colors={planHeroWash(plan, isDark)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.identity}>
        <View
          style={[
            styles.motif,
            {
              backgroundColor: colorWithAlpha(brandAccent, isDark ? 0.22 : 0.14),
              borderColor: colorWithAlpha(brandAccent, isDark ? 0.35 : 0.22),
            },
          ]}>
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
          icon="calendar-outline"
        />
      </View>
    </View>
  );
}

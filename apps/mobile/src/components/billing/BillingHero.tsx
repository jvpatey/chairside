import type { ClinicBillingState } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BillingMetricTile } from '@/components/billing/BillingMetricTile';
import { PlanTierBadge } from '@/components/billing/PlanTierBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  CLINIC_PLAN_ICONS,
  formatClinicSubscriptionStatus,
  formatSubscriptionStatusBadge,
  getClinicPlanBrandAccentColor,
  getClinicPlanHeroSummary,
  getClinicPlanSubtleBackground,
  getRecommendedUpgradePlan,
} from '@/lib/clinicPlanPresentation';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

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
  /** Compact surface layout for the web plans dialog. */
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

export function BillingHero({
  billing,
  canManageSubscription,
  isManagingSubscription,
  isPurchaseBillingAvailable,
  recommendedUpgradeLabel,
  isPurchasing = false,
  onManageSubscription,
  onUpgrade,
  onComparePlans,
  compact = Platform.OS === 'web',
}: BillingHeroProps) {
  const { colors, isDark } = useTheme();
  const plan = billing.plan;
  const brandAccent = getClinicPlanBrandAccentColor(plan, colors);
  const statusBadge =
    plan !== 'free' ? formatSubscriptionStatusBadge(billing.status) : null;
  const renewalLabel = formatClinicSubscriptionStatus(billing.status, billing.currentPeriodEnd);
  const recommendedPlan = getRecommendedUpgradePlan(
    plan,
    billing.planFamily === 'group' || billing.accountType === 'group' ? 'group' : 'clinic',
  );

  const statusColor =
    statusBadge?.tone === 'success'
      ? colors.success
      : statusBadge?.tone === 'warning'
        ? colors.warning
        : colors.labelTertiary;

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    band: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    compactCard: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      backgroundColor: getClinicPlanSubtleBackground(plan, colors),
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    compactHeader: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.label,
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    heading: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      color: colors.labelPrimary,
    },
    badgeRow: {
      justifyContent: 'flex-start',
    },
    summary: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    renewal: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    actions: {
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    compactActions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    secondaryLink: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
    },
    compactSecondaryLink: {
      alignSelf: 'center' as const,
      paddingVertical: 0,
    },
    secondaryLinkText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    upgradeButton: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 200,
    },
  }));

  const roleAtLimit =
    billing.activeRoleLimit != null && billing.activeRoleCount >= billing.activeRoleLimit;
  const fillInAtLimit =
    billing.activeFillInLimit != null && billing.activeFillInCount >= billing.activeFillInLimit;

  const metrics = (
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
  );

  const upgradeOrManage =
    canManageSubscription && onManageSubscription ? (
      <OnboardingButton
        label={isManagingSubscription ? 'Opening…' : 'Manage subscription'}
        variant="primary"
        disabled={isManagingSubscription}
        onPress={onManageSubscription}
      />
    ) : isPurchaseBillingAvailable && recommendedPlan && onUpgrade ? (
      <OnboardingButton
        label={
          isPurchasing
            ? 'Processing…'
            : (recommendedUpgradeLabel ?? `Upgrade to ${recommendedPlan}`)
        }
        variant="primary"
        disabled={isPurchasing}
        onPress={onUpgrade}
      />
    ) : null;

  const statusBadges = (
    <View style={styles.badgeRow}>
      <BadgeRow>
        <PlanTierBadge plan={plan} size="sm" />
        {statusBadge ? (
          <PillBadge
            label={statusBadge.label}
            color={statusColor}
            backgroundColor={colorWithAlpha(statusColor, isDark ? 0.18 : 0.1)}
            borderColor={colorWithAlpha(statusColor, 0.28)}
            size="sm"
          />
        ) : null}
      </BadgeRow>
    </View>
  );

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <Text style={styles.eyebrow}>Current plan</Text>
          {statusBadges}
          <Text style={styles.summary}>{getClinicPlanHeroSummary(plan)}</Text>
          {renewalLabel ? <Text style={styles.renewal}>{renewalLabel}</Text> : null}
        </View>

        {metrics}

        {upgradeOrManage || (onComparePlans && plan !== 'pro') ? (
          <View style={styles.compactActions}>
            {upgradeOrManage ? <View style={styles.upgradeButton}>{upgradeOrManage}</View> : null}
            {onComparePlans && plan !== 'pro' ? (
              <Pressable style={styles.compactSecondaryLink} onPress={onComparePlans}>
                <Text style={styles.secondaryLinkText}>Compare plans</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.band}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={26} color={brandAccent} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.eyebrow}>Your plan</Text>
          {statusBadges}
          <Text style={styles.summary}>{getClinicPlanHeroSummary(plan)}</Text>
          {renewalLabel ? <Text style={styles.renewal}>{renewalLabel}</Text> : null}
        </View>
      </View>

      {metrics}

      {(upgradeOrManage || (onComparePlans && plan !== 'pro')) && (
        <View style={styles.actions}>
          {upgradeOrManage}
          {onComparePlans && plan !== 'pro' ? (
            <Pressable style={styles.secondaryLink} onPress={onComparePlans}>
              <Text style={styles.secondaryLinkText}>Compare plans</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

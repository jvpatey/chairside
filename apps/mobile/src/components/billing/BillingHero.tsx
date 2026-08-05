import type { ClinicBillingState } from '@chairside/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BillingMetricTile } from '@/components/billing/BillingMetricTile';
import { PlanTierBadge } from '@/components/billing/PlanTierBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  formatClinicSubscriptionStatus,
  formatSubscriptionStatusBadge,
  getClinicPlanHeroSummary,
  getRecommendedUpgradePlan,
} from '@/lib/clinicPlanPresentation';
import { colorWithAlpha, getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

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

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
    },
    compactCard: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    headingBlock: {
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
    },
    compactHeader: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.label,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    heading: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    badgeRow: {
      justifyContent: 'center',
    },
    compactBadgeRow: {
      justifyContent: 'flex-start',
    },
    summary: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.labelSecondary,
      maxWidth: 320,
    },
    compactSummary: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'left' as const,
      color: colors.labelSecondary,
      maxWidth: undefined,
    },
    renewal: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      color: colors.labelTertiary,
    },
    compactRenewal: {
      textAlign: 'left' as const,
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

  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

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
      />
      <BillingMetricTile
        label="Active fill-ins"
        value={formatMetricValue(billing.activeFillInCount, billing.activeFillInLimit)}
        hint={formatMetricHint(billing.activeFillInCount, billing.activeFillInLimit)}
        atLimit={fillInAtLimit}
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

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <Text style={styles.eyebrow}>Current plan</Text>
          <View style={[styles.badgeRow, styles.compactBadgeRow]}>
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
          <Text style={styles.compactSummary}>{getClinicPlanHeroSummary(plan)}</Text>
          {renewalLabel ? (
            <Text style={[styles.renewal, styles.compactRenewal]}>{renewalLabel}</Text>
          ) : null}
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
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Your plan</Text>
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
          <Text style={styles.summary}>{getClinicPlanHeroSummary(plan)}</Text>
          {renewalLabel ? <Text style={styles.renewal}>{renewalLabel}</Text> : null}
        </View>

        {metrics}

        <View style={styles.actions}>
          {upgradeOrManage}
          {onComparePlans && plan !== 'pro' ? (
            <Pressable style={styles.secondaryLink} onPress={onComparePlans}>
              <Text style={styles.secondaryLinkText}>Compare plans</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

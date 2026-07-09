import type { ClinicBillingState } from '@chairside/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
}: BillingHeroProps) {
  const { colors, isDark } = useTheme();
  const plan = billing.plan;
  const statusBadge =
    plan !== 'free' ? formatSubscriptionStatusBadge(billing.status) : null;
  const renewalLabel = formatClinicSubscriptionStatus(billing.status, billing.currentPeriodEnd);
  const recommendedPlan = getRecommendedUpgradePlan(plan);

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
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
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
    summary: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.labelSecondary,
      maxWidth: 320,
    },
    renewal: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
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
    secondaryLink: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
    },
    secondaryLinkText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const roleAtLimit =
    billing.activeRoleLimit != null && billing.activeRoleCount >= billing.activeRoleLimit;
  const fillInAtLimit =
    billing.activeFillInLimit != null && billing.activeFillInCount >= billing.activeFillInLimit;

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

        <View style={styles.actions}>
          {canManageSubscription && onManageSubscription ? (
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
          ) : null}

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

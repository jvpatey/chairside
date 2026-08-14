import type { ClinicBillingState } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BillingMetricTile } from '@/components/billing/BillingMetricTile';
import { BillingSubscriptionStrip } from '@/components/billing/BillingSubscriptionStrip';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PillBadge } from '@/components/ui/PillBadge';
import { getClinicPlanLabel } from '@/contexts/ClinicBillingContext';
import type { BillingCycle } from '@/lib/billingOfferings';
import {
  CLINIC_PLAN_ICONS,
  formatSubscriptionStatusBadge,
  getClinicPlanBrandAccentColor,
  getClinicPlanHeroSummary,
  getClinicPlanSubtleBackground,
  getRecommendedUpgradePlan,
} from '@/lib/clinicPlanPresentation';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { webHover, webPointer } from '@/lib/webPressableStyles';
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
  activeBillingCycle?: BillingCycle | null;
  activePriceLabel?: string | null;
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

/** Web billing hero — plan identity, subscription facts, usage, and manage. */
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
  activeBillingCycle = null,
  activePriceLabel = null,
}: BillingHeroProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const plan = billing.plan;
  const planLabel = getClinicPlanLabel(plan);
  const brandAccent = getClinicPlanBrandAccentColor(plan, colors);
  const statusBadge = plan !== 'free' ? formatSubscriptionStatusBadge(billing.status) : null;
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

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      // @ts-expect-error web shadow
      boxShadow: getWebShadow(isDark, 'raised'),
    },
    accentRail: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: brandAccent,
    },
    inner: {
      paddingVertical: spacing.lg,
      paddingRight: spacing.lg,
      paddingLeft: spacing.lg + 8,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
      ...webPointer(),
    },
    headerHovered: {
      opacity: 0.92,
    },
    headerPressed: {
      opacity: 0.88,
    },
    identity: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
      flex: 1,
      minWidth: 240,
    },
    motif: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      backgroundColor: getClinicPlanSubtleBackground(plan, colors),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(brandAccent, isDark ? 0.32 : 0.18),
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    eyebrowRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    eyebrow: {
      ...webTypography.eyebrow,
      fontSize: 11,
      letterSpacing: 0.7,
      color: colors.labelTertiary,
    },
    titleRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    planName: {
      ...webTypography.headline,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.8,
      color: colors.labelPrimary,
    },
    summary: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      maxWidth: 420,
    },
    footer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'stretch' as const,
      gap: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    metricsRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      flex: 1,
      minWidth: 280,
      alignItems: 'stretch' as const,
    },
    manageBlock: {
      alignSelf: 'stretch' as const,
      alignItems: 'flex-end' as const,
    },
    manageButton: {
      alignSelf: 'flex-end' as const,
      minWidth: 188,
    },
    manageButtonSurface: {
      minHeight: 40,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
    },
    chevron: {
      marginTop: 8,
      flexShrink: 0,
    },
    details: {
      gap: spacing.lg,
    },
    compareLink: {
      alignSelf: 'center' as const,
      paddingVertical: spacing.xs,
    },
    compareLinkText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const roleAtLimit =
    billing.activeRoleLimit != null && billing.activeRoleCount >= billing.activeRoleLimit;
  const fillInAtLimit =
    billing.activeFillInLimit != null && billing.activeFillInCount >= billing.activeFillInLimit;

  const manageControl =
    canManageSubscription && onManageSubscription ? (
      <View style={styles.manageBlock}>
        <OnboardingButton
          label={isManagingSubscription ? 'Opening…' : 'Manage subscription'}
          variant="secondary"
          disabled={isManagingSubscription}
          onPress={onManageSubscription}
          style={styles.manageButton}
          buttonStyle={styles.manageButtonSurface}
        />
      </View>
    ) : null;

  const upgradeControl =
    !manageControl && isPurchaseBillingAvailable && recommendedPlan && onUpgrade ? (
      <View style={styles.manageBlock}>
        <OnboardingButton
          label={
            isPurchasing
              ? 'Processing…'
              : (recommendedUpgradeLabel ?? `Upgrade to ${recommendedPlan}`)
          }
          variant="primary"
          disabled={isPurchasing}
          onPress={onUpgrade}
          style={styles.manageButton}
          buttonStyle={styles.manageButtonSurface}
        />
        {onComparePlans && plan !== 'pro' ? (
          <Pressable style={styles.compareLink} onPress={onComparePlans}>
            <Text style={styles.compareLinkText}>Compare plans</Text>
          </Pressable>
        ) : null}
      </View>
    ) : onComparePlans && plan !== 'pro' && !manageControl ? (
      <Pressable style={styles.compareLink} onPress={onComparePlans}>
        <Text style={styles.compareLinkText}>Compare plans</Text>
      </Pressable>
    ) : null;

  return (
    <View style={styles.card}>
      <View style={styles.accentRail} pointerEvents="none" />
      <View style={styles.inner}>
        <Pressable
          onPress={() => setExpanded((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={`${planLabel} plan`}
          accessibilityState={{ expanded }}
          accessibilityHint={expanded ? 'Hides subscription details' : 'Shows subscription details'}
          style={({ pressed, hovered }) => [
            styles.header,
            webHover(hovered, pressed, styles.headerHovered),
            pressed && styles.headerPressed,
          ]}
        >
          <View style={styles.identity}>
            <View style={styles.motif}>
              <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={30} color={brandAccent} />
            </View>
            <View style={styles.copy}>
              <View style={styles.eyebrowRow}>
                <Text style={styles.eyebrow}>Current plan</Text>
                {statusBadge ? (
                  <PillBadge
                    label={statusBadge.label}
                    color={statusColor}
                    backgroundColor={colorWithAlpha(statusColor, isDark ? 0.18 : 0.1)}
                    borderColor={colorWithAlpha(statusColor, 0.28)}
                    size="sm"
                  />
                ) : null}
              </View>
              <Text style={styles.planName}>{planLabel}</Text>
              <Text style={styles.summary}>{getClinicPlanHeroSummary(plan)}</Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.labelTertiary}
            style={styles.chevron}
          />
        </Pressable>

        {expanded ? (
          <View style={styles.details}>
            {manageControl ?? upgradeControl}

            {plan !== 'free' ? (
              <BillingSubscriptionStrip
                status={billing.status}
                currentPeriodEnd={billing.currentPeriodEnd}
                billingCycle={activeBillingCycle}
                priceLabel={activePriceLabel}
                compact
              />
            ) : null}

            <View style={styles.footer}>
              <View style={styles.metricsRow}>
                <BillingMetricTile
                  label="Active roles"
                  value={formatMetricValue(billing.activeRoleCount, billing.activeRoleLimit)}
                  hint={formatMetricHint(billing.activeRoleCount, billing.activeRoleLimit)}
                  atLimit={roleAtLimit}
                  accent={colors.primary}
                  icon="briefcase-outline"
                  variant="inset"
                />
                <BillingMetricTile
                  label="Active fill-ins"
                  value={formatMetricValue(billing.activeFillInCount, billing.activeFillInLimit)}
                  hint={formatMetricHint(billing.activeFillInCount, billing.activeFillInLimit)}
                  atLimit={fillInAtLimit}
                  accent={colors.secondary}
                  icon={FILL_IN_ICON.outline}
                  variant="inset"
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

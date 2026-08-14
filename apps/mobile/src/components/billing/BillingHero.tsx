import type { ClinicBillingState } from '@chairside/api';
import { CLINIC_PLAN_LABELS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BillingMetricTile } from '@/components/billing/BillingMetricTile';
import { BillingSubscriptionStrip } from '@/components/billing/BillingSubscriptionStrip';
import { PillBadge } from '@/components/ui/PillBadge';
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
import { colorWithAlpha, getElevationStyle, radii, useTheme, useThemedStyles } from '@/theme';

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
  activeBillingCycle = null,
  activePriceLabel = null,
}: BillingHeroProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const plan = billing.plan;
  const planLabel = CLINIC_PLAN_LABELS[plan];
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

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
      ...getElevationStyle({ isDark, level: 'raised' }),
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
      padding: compact ? spacing.md : spacing.lg,
      paddingLeft: (compact ? spacing.md : spacing.lg) + 8,
      gap: compact ? spacing.md : spacing.lg,
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
    iconWrap: {
      width: compact ? 48 : 56,
      height: compact ? 48 : 56,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      backgroundColor: getClinicPlanSubtleBackground(plan, colors),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(brandAccent, isDark ? 0.32 : 0.2),
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    identityRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    eyebrowRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    eyebrow: {
      ...typography.label,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    planName: {
      ...typography.title,
      fontSize: compact ? 26 : 28,
      lineHeight: compact ? 32 : 34,
      letterSpacing: -0.6,
      color: colors.labelPrimary,
    },
    summary: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    footer: {
      gap: spacing.md,
      paddingTop: compact ? spacing.sm : spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
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
    manageBlock: {
      alignSelf: 'stretch' as const,
      alignItems: 'flex-end' as const,
    },
    manageButton: {
      alignSelf: 'flex-end' as const,
      minWidth: 180,
    },
    manageButtonSurface: {
      minHeight: 40,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
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
    chevron: {
      marginTop: 6,
      flexShrink: 0,
    },
    details: {
      gap: compact ? spacing.md : spacing.lg,
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

  const subscriptionStrip =
    plan !== 'free' ? (
      <BillingSubscriptionStrip
        status={billing.status}
        currentPeriodEnd={billing.currentPeriodEnd}
        billingCycle={activeBillingCycle}
        priceLabel={activePriceLabel}
        compact={compact}
      />
    ) : null;

  const metrics = (
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
  );

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

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  return (
    <View style={styles.card}>
      <View style={styles.accentRail} pointerEvents="none" />
      <View style={styles.inner}>
        <Pressable
          onPress={toggleExpanded}
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
          <View style={styles.identityRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={compact ? 24 : 28} color={brandAccent} />
            </View>
            <View style={styles.identity}>
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
            {manageControl}

            {subscriptionStrip}

            <View style={styles.footer}>
              {metrics}
              {upgradeControl || (onComparePlans && plan !== 'pro' && !manageControl) ? (
                compact ? (
                  <View style={styles.compactActions}>
                    {upgradeControl ? <View style={styles.upgradeButton}>{upgradeControl}</View> : null}
                    {onComparePlans && plan !== 'pro' && !manageControl ? (
                      <Pressable style={styles.compactSecondaryLink} onPress={onComparePlans}>
                        <Text style={styles.secondaryLinkText}>Compare plans</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.actions}>
                    {upgradeControl}
                    {onComparePlans && plan !== 'pro' && !manageControl ? (
                      <Pressable style={styles.secondaryLink} onPress={onComparePlans}>
                        <Text style={styles.secondaryLinkText}>Compare plans</Text>
                      </Pressable>
                    ) : null}
                  </View>
                )
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

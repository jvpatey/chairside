import {
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PillBadge } from '@/components/ui/PillBadge';
import { getClinicPlanLabel } from '@/contexts/ClinicBillingContext';
import {
  formatYearlySavingsBadge,
  formatYearlySavingsDetail,
  type YearlySavings,
} from '@/lib/billingOfferings';
import { CLINIC_PLAN_ICONS } from '@/lib/clinicPlanPresentation';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

export type PlanComparisonCardProps = {
  plan: ClinicPlan;
  priceLabel: string;
  billingCycleLabel?: string | null;
  yearlySavings?: YearlySavings | null;
  isCurrent: boolean;
  isRecommended?: boolean;
  actionLabel: string;
  actionVariant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

export function PlanComparisonCard({
  plan,
  priceLabel,
  billingCycleLabel,
  yearlySavings,
  isCurrent,
  isRecommended = false,
  actionLabel,
  actionVariant = 'primary',
  disabled = false,
  loading = false,
  onPress,
}: PlanComparisonCardProps) {
  const { colors, isDark } = useTheme();
  const marketing = CLINIC_PLAN_MARKETING[plan];
  const emphasized = isCurrent || (isRecommended && !isCurrent);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    card: {
      backgroundColor: isCurrent
        ? colorWithAlpha(colors.primary, isDark ? 0.08 : 0.04)
        : colors.surface,
      borderRadius: radii.lg,
      borderWidth: isCurrent ? 2 : 1,
      borderColor: isCurrent
        ? colors.primary
        : isRecommended
          ? colorWithAlpha(colors.primary, isDark ? 0.32 : 0.22)
          : colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      minHeight: isCurrent || isRecommended ? 24 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: emphasized
        ? colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)
        : colors.fillSubtle,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 19,
      color: colors.labelPrimary,
    },
    tagline: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    priceBlock: {
      gap: spacing.xs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    price: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 22,
      color: colors.labelPrimary,
    },
    priceMeta: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
    },
    savingsDetail: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.success,
    },
    features: {
      gap: spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    feature: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      flex: 1,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {isCurrent ? (
          <PillBadge
            label="Current plan"
            color={colors.primaryOnPrimary}
            backgroundColor={colors.primary}
            size="sm"
          />
        ) : null}
        {isRecommended && !isCurrent ? (
          <PillBadge
            label="Recommended upgrade"
            color={colors.primary}
            backgroundColor={colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)}
            borderColor={colorWithAlpha(colors.primary, 0.25)}
            size="sm"
          />
        ) : null}
      </View>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={CLINIC_PLAN_ICONS[plan]}
            size={21}
            color={emphasized ? colors.primary : colors.labelSecondary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{getClinicPlanLabel(plan)}</Text>
          <Text style={styles.tagline}>{marketing.tagline}</Text>
        </View>
      </View>

      <View style={styles.priceBlock}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{priceLabel}</Text>
          {yearlySavings ? (
            <PillBadge
              label={formatYearlySavingsBadge(yearlySavings)}
              color={colors.success}
              backgroundColor={colorWithAlpha(colors.success, isDark ? 0.18 : 0.12)}
              borderColor={colorWithAlpha(colors.success, 0.28)}
              size="sm"
            />
          ) : null}
        </View>
        {billingCycleLabel ? <Text style={styles.priceMeta}>{billingCycleLabel}</Text> : null}
        {yearlySavings ? (
          <Text style={styles.savingsDetail}>{formatYearlySavingsDetail(yearlySavings)}</Text>
        ) : null}
      </View>

      <View style={styles.features}>
        {marketing.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={17}
              color={emphasized ? colors.primary : colors.success}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.feature}>{feature}</Text>
          </View>
        ))}
      </View>

      {onPress ? (
        <OnboardingButton
          label={loading ? 'Processing…' : actionLabel}
          variant={actionVariant}
          disabled={disabled || loading}
          onPress={onPress}
        />
      ) : (
        <OnboardingButton label={actionLabel} variant="secondary" disabled />
      )}
    </View>
  );
}

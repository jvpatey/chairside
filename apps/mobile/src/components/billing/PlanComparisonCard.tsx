import {
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Text, View, type ViewStyle } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PillBadge } from '@/components/ui/PillBadge';
import { getClinicPlanLabel } from '@/contexts/ClinicBillingContext';
import {
  formatYearlySavingsBadge,
  formatYearlySavingsDetail,
  type YearlySavings,
} from '@/lib/billingOfferings';
import {
  CLINIC_PLAN_ICONS,
  getClinicPlanBrandAccentColor,
  getClinicPlanFeatureAccentColor,
} from '@/lib/clinicPlanPresentation';
import { webCardLiftBase, webOnlyStyle } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { getWebShadow } from '@/theme/web';

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

const IS_WEB = Platform.OS === 'web';

/** Soft top wash tinted to the plan brand (landing pricing style). */
function planWashColors(plan: ClinicPlan, isDark: boolean): [string, string] {
  if (plan === 'free') {
    return isDark
      ? ['rgba(48, 209, 88, 0.2)', 'transparent']
      : ['rgba(52, 199, 89, 0.14)', 'transparent'];
  }
  if (plan === 'pro' || plan === 'group_pro') {
    return isDark
      ? ['rgba(152, 150, 255, 0.22)', 'transparent']
      : ['rgba(88, 86, 214, 0.14)', 'transparent'];
  }
  return isDark
    ? ['rgba(74, 154, 255, 0.2)', 'transparent']
    : ['rgba(26, 111, 212, 0.12)', 'transparent'];
}

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
  const brandAccent = getClinicPlanBrandAccentColor(plan, colors);
  const featureAccent = getClinicPlanFeatureAccentColor(plan, colors, emphasized);
  const actionAccent: GradientAccent =
    plan === 'pro' || plan === 'group_pro' ? 'secondary' : 'primary';
  const onAccent =
    plan === 'pro' || plan === 'group_pro'
      ? colors.secondaryOnSecondary
      : plan === 'free'
        ? colors.primaryOnPrimary
        : colors.primaryOnPrimary;

  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: IS_WEB ? 16 : radii.lg,
      borderWidth: IS_WEB ? 2 : isCurrent ? 2 : 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      ...(IS_WEB
        ? ({
            height: '100%',
            ...webCardLiftBase(),
            ...webOnlyStyle({
              boxShadow: getWebShadow(isDark, 'subtle'),
            } as ViewStyle),
          } as object)
        : null),
    },
    // Current keeps plan wash — only border strengthens; badge carries “current”.
    cardCurrent: {
      borderColor: brandAccent,
      backgroundColor: colorWithAlpha(brandAccent, isDark ? 0.1 : 0.05),
    },
    cardRecommended: IS_WEB
      ? {
          backgroundColor: colorWithAlpha(brandAccent, isDark ? 0.08 : 0.04),
          borderColor: colorWithAlpha(brandAccent, isDark ? 0.45 : 0.32),
        }
      : {
          borderColor: colorWithAlpha(brandAccent, isDark ? 0.32 : 0.22),
        },
    wash: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    content: {
      gap: spacing.md,
      zIndex: 1,
      ...(IS_WEB ? { flexGrow: 1 } : null),
    },
    badgeRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      minHeight: isCurrent || isRecommended ? 24 : 0,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: IS_WEB ? 14 : radii.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(brandAccent, isDark ? 0.18 : 0.1),
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      ...typography.body,
      fontWeight: '700' as const,
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    price: {
      ...typography.body,
      fontWeight: '700' as const,
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
      ...(IS_WEB ? { flexGrow: 1 } : null),
    },
    featureRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      alignItems: 'flex-start' as const,
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
    <View
      style={[
        styles.card,
        isCurrent ? styles.cardCurrent : null,
        !isCurrent && isRecommended ? styles.cardRecommended : null,
      ]}>
      {IS_WEB ? (
        <LinearGradient
          colors={planWashColors(plan, isDark)}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.wash}
          pointerEvents="none"
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          {isCurrent ? (
            <PillBadge
              label="Current plan"
              color={onAccent}
              backgroundColor={brandAccent}
              size="sm"
            />
          ) : null}
          {isRecommended && !isCurrent ? (
            <PillBadge
              label={IS_WEB ? 'Recommended' : 'Recommended upgrade'}
              color={brandAccent}
              backgroundColor={colorWithAlpha(brandAccent, isDark ? 0.18 : 0.1)}
              borderColor={colorWithAlpha(brandAccent, 0.25)}
              size="sm"
            />
          ) : null}
        </View>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={21} color={brandAccent} />
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
                color={featureAccent}
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
            accent={actionAccent}
            disabled={disabled || loading}
            onPress={onPress}
          />
        ) : (
          <OnboardingButton label={actionLabel} variant="secondary" disabled />
        )}
      </View>
    </View>
  );
}

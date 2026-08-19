import {
  CLINIC_PLAN_LABELS,
  CLINIC_PLAN_MARKETING,
  isClinicPlanFeatureIntro,
  type ClinicPlan,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { WebMarketingSectionHeader } from '@/components/web/marketing/WebMarketingSnapshotShell.web';
import { CLINIC_PLAN_ICONS, getClinicPlanBrandAccentColor, getClinicPlanSubtleBackground } from '@/lib/clinicPlanPresentation';
import { webCardLiftBase, webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { useContentSwapAnimation } from '@/lib/webMotion.web';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type PricingAudience = 'clinic' | 'group';

const CLINIC_AUDIENCE_PLANS: readonly ClinicPlan[] = ['free', 'starter', 'pro'];
const GROUP_AUDIENCE_PLANS: readonly ClinicPlan[] = ['free', 'group_starter', 'group_pro'];

const TRUST_POINTS = [
  { icon: 'leaf-outline' as const, label: 'Start free' },
  { icon: 'trending-up-outline' as const, label: 'Upgrade when hiring volume grows' },
] as const;

const GROUP_FREE_TAGLINE = 'Try multi-location hiring at no cost';
const GROUP_FREE_FEATURES = [
  'Up to 2 locations and 1 manager per location',
  '1 active role and 1 fill-in across your group',
  'Review applications and message candidates',
] as const;

type PlanLandingPrice = {
  monthly: string;
  yearly: string;
  annualSavingsPercent: number;
};

const PLAN_LANDING_PRICES: Partial<Record<ClinicPlan, PlanLandingPrice>> = {
  starter: { monthly: '59.99', yearly: '599.99', annualSavingsPercent: 17 },
  pro: { monthly: '99.99', yearly: '999.99', annualSavingsPercent: 17 },
  group_starter: { monthly: '129.99', yearly: '1,199.99', annualSavingsPercent: 23 },
  group_pro: { monthly: '199.99', yearly: '1,399.99', annualSavingsPercent: 42 },
};

function PricingCardPrice({
  plan,
  audience,
  styles,
}: {
  plan: ClinicPlan;
  audience: PricingAudience;
  styles: {
    priceBlock: object;
    priceRow: object;
    priceCurrency: object;
    priceAmount: object;
    pricePeriod: object;
    priceSecondary: object;
  };
}) {
  const pricing = PLAN_LANDING_PRICES[plan];

  if (plan === 'free') {
    const secondary =
      audience === 'group'
        ? '2 locations and 1 manager per location · No subscription required'
        : '1 role and 1 fill-in included · No subscription required';
    return (
      <View style={styles.priceBlock}>
        <View style={styles.priceRow}>
          <Text style={styles.priceCurrency}>CA$</Text>
          <Text style={styles.priceAmount}>0</Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        <Text style={styles.priceSecondary}>{secondary}</Text>
      </View>
    );
  }

  if (!pricing) return null;

  return (
    <View style={styles.priceBlock}>
      <View style={styles.priceRow}>
        <Text style={styles.priceCurrency}>CA$</Text>
        <Text style={styles.priceAmount}>{pricing.monthly}</Text>
        <Text style={styles.pricePeriod}>/mo</Text>
      </View>
      <Text style={styles.priceSecondary}>
        CA${pricing.yearly}/yr · Save {pricing.annualSavingsPercent}% annually
      </Text>
    </View>
  );
}

function PricingAudienceToggle({
  value,
  onChange,
}: {
  value: PricingAudience;
  onChange: (audience: PricingAudience) => void;
}) {
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    wrap: {
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: 440,
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row' as const,
      backgroundColor: colors.fillSubtle,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: 3,
      gap: 3,
    },
    option: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm + 2,
      minHeight: 44,
      ...webOnlyStyle({
        transition: 'background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
        cursor: 'pointer',
      } as object),
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.12 : 0.2),
    },
    label: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    labelSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700' as const,
    },
  }));

  const options: { id: PricingAudience; label: string }[] = [
    { id: 'clinic', label: 'Individual clinics' },
    { id: 'group', label: 'Multi-location groups' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="tablist">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PricingPlanCard({
  plan,
  audience,
  enterDelayMs,
  animate = true,
}: {
  plan: ClinicPlan;
  audience: PricingAudience;
  enterDelayMs?: number;
  animate?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);
  const marketing = CLINIC_PLAN_MARKETING[plan];
  const brand = getClinicPlanBrandAccentColor(plan, colors);
  const featureAccent = getClinicPlanBrandAccentColor(plan, colors);
  const isGroupFree = plan === 'free' && audience === 'group';
  const tagline = isGroupFree ? GROUP_FREE_TAGLINE : marketing.tagline;
  const features = isGroupFree ? GROUP_FREE_FEATURES : marketing.features;

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    cardWrap: {
      flex: 1,
      minWidth: 0,
    },
    card: {
      flex: 1,
      borderRadius: 20,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.lg,
      ...webCardLiftBase(),
      ...webOnlyStyle({
        boxShadow: getWebShadow(isDark, 'subtle'),
      } as object),
    },
    content: {
      flex: 1,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
      minHeight: 64,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: getClinicPlanSubtleBackground(plan, colors),
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    tagline: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    priceBlock: {
      gap: spacing.xs,
      minHeight: 56,
    },
    priceRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      gap: 2,
    },
    priceCurrency: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      paddingBottom: 4,
    },
    priceAmount: {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      letterSpacing: -0.5,
    },
    pricePeriod: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
      paddingBottom: 5,
      marginLeft: 2,
    },
    priceSecondary: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    features: {
      gap: spacing.sm,
    },
    featureRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      alignItems: 'flex-start' as const,
    },
    feature: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    featureIntro: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  return (
    <WebPageEnter
      delayMs={enterDelayMs}
      style={styles.cardWrap}
      animate={animate}
      trigger="visible"
    >
      <View style={[styles.card, liftStyle]} {...hoverHandlers}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name={CLINIC_PLAN_ICONS[plan]} size={22} color={brand} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{CLINIC_PLAN_LABELS[plan]}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
          </View>

          <PricingCardPrice plan={plan} audience={audience} styles={styles} />

          <View style={styles.features}>
            {features.map((feature) => {
              const isIntro = isClinicPlanFeatureIntro(feature);
              return (
                <View key={feature} style={styles.featureRow}>
                  {isIntro ? null : (
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color={featureAccent}
                      style={{ marginTop: 1 }}
                    />
                  )}
                  <Text style={isIntro ? styles.featureIntro : styles.feature}>{feature}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </WebPageEnter>
  );
}

function PricingTrustStrip() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    strip: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: spacing.lg,
      marginTop: spacing.xl,
    },
    item: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={320} trigger="visible">
      <View style={styles.strip}>
        {TRUST_POINTS.map((point) => (
          <View key={point.label} style={styles.item}>
            <Ionicons name="checkmark-circle" size={16} color={colors.tertiary} />
            <Text style={styles.label}>{point.label}</Text>
          </View>
        ))}
      </View>
    </WebPageEnter>
  );
}

function PricingAudiencePanel({
  audience,
  isWide,
}: {
  audience: PricingAudience;
  isWide: boolean;
}) {
  const { opacity, translateY, displayKey } = useContentSwapAnimation(audience);
  const displayAudience = displayKey as PricingAudience;
  const plans =
    displayAudience === 'clinic' ? CLINIC_AUDIENCE_PLANS : GROUP_AUDIENCE_PLANS;

  const styles = useThemedStyles(({ spacing }) => ({
    panel: {
      gap: spacing.xl,
    },
    cards: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.lg,
      alignItems: 'stretch' as const,
    },
  }));

  return (
    <Animated.View
      style={[styles.panel, { opacity, transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite">
      <View style={styles.cards}>
        {plans.map((plan) => (
          <PricingPlanCard
            key={`${displayAudience}-${plan}`}
            plan={plan}
            audience={displayAudience}
            animate={false}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export function WebLandingPricing() {
  const { isWide } = useResponsiveLayout();
  const [audience, setAudience] = useState<PricingAudience>('clinic');
  const subtitle =
    audience === 'clinic'
      ? 'Post your first role and fill-in at no cost. Upgrade when you need more.'
      : 'Try up to 2 locations and 1 manager per location free. Upgrade for more locations and hiring across your group.';

  const handleAudienceChange = (next: PricingAudience) => {
    if (next === audience) return;
    setAudience(next);
  };

  const styles = useThemedStyles(({ spacing }) => ({
    bleed: {
      paddingTop: spacing.xl * 1.25,
      paddingBottom: spacing.xl * 2.5,
      overflow: 'hidden' as const,
    },
  }));

  return (
    <WebMarketingSection style={styles.bleed} sectionId="pricing">
      <WebMarketingSectionHeader
        eyebrow="Pricing"
        title="Clinic plans. Professionals always free."
        subtitle={subtitle}
        align="center"
      />

      <PricingAudienceToggle value={audience} onChange={handleAudienceChange} />

      <PricingAudiencePanel audience={audience} isWide={isWide} />

      <PricingTrustStrip />
    </WebMarketingSection>
  );
}

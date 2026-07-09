import {
  CLINIC_PLAN_LABELS,
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { CLINIC_PLAN_ICONS } from '@/lib/clinicPlanPresentation';
import { webCardLiftBase, webOnlyStyle } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const PLANS: readonly {
  plan: ClinicPlan;
  isRecommended?: boolean;
}[] = [
  { plan: 'free' },
  { plan: 'starter', isRecommended: true },
  { plan: 'pro' },
];

const TRUST_POINTS = [
  { icon: 'leaf-outline' as const, label: 'Start free' },
  { icon: 'trending-up-outline' as const, label: 'Upgrade when hiring volume grows' },
  { icon: 'medical-outline' as const, label: 'Professionals stay free' },
] as const;

function featureAccentColor(
  plan: ClinicPlan,
  emphasized: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  if (plan === 'pro') return colors.secondary;
  if (emphasized) return colors.primary;
  return colors.success;
}

function PricingPlanCard({
  plan,
  isRecommended = false,
  enterDelayMs,
}: {
  plan: ClinicPlan;
  isRecommended?: boolean;
  enterDelayMs?: number;
}) {
  const { colors, isDark } = useTheme();
  const marketing = CLINIC_PLAN_MARKETING[plan];
  const emphasized = isRecommended;
  const featureAccent = featureAccentColor(plan, emphasized, colors);

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    cardWrap: {
      flex: 1,
      minWidth: 0,
    },
    card: {
      flex: 1,
      borderRadius: 24,
      padding: spacing.xl,
      backgroundColor: emphasized
        ? colorWithAlpha(colors.primary, isDark ? 0.06 : 0.03)
        : colors.surface,
      borderWidth: emphasized ? 2 : 1,
      borderColor: emphasized
        ? colorWithAlpha(colors.primary, isDark ? 0.45 : 0.35)
        : colors.separator,
      gap: spacing.lg,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      ...webCardLiftBase(),
      ...webOnlyStyle({
        boxShadow: getWebShadow(isDark, emphasized ? 'raised' : 'subtle'),
      } as object),
    },
    atmosphere: {
      ...webOnlyStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundImage: emphasized
          ? isDark
            ? 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(74, 154, 255, 0.16) 0%, transparent 65%)'
            : 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(26, 111, 212, 0.1) 0%, transparent 65%)'
          : undefined,
      } as object),
    },
    content: {
      flex: 1,
      gap: spacing.lg,
      zIndex: 1,
    },
    badgeRow: {
      minHeight: 24,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: emphasized
        ? colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)
        : colors.fillSubtle,
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
    },
    price: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    priceMeta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    features: {
      gap: spacing.sm,
      flex: 1,
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
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={styles.cardWrap}>
      <View style={styles.card}>
        {emphasized ? <View style={styles.atmosphere} /> : null}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {isRecommended ? (
              <PillBadge
                label="Popular for growing clinics"
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
                size={22}
                color={emphasized ? colors.primary : colors.labelSecondary}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{CLINIC_PLAN_LABELS[plan]}</Text>
              <Text style={styles.tagline}>{marketing.tagline}</Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.price}>{marketing.fallbackPriceLabel}</Text>
            {plan !== 'free' ? (
              <Text style={styles.priceMeta}>
                Billed monthly or annually · upgrade anytime after signup
              </Text>
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
        </View>
      </View>
    </WebPageEnter>
  );
}

function PricingTrustStrip() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    strip: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colorWithAlpha(colors.fillSubtle, isDark ? 0.65 : 1),
    },
    item: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={320}>
      <View style={styles.strip}>
        {TRUST_POINTS.map((point) => (
          <View key={point.label} style={styles.item}>
            <Ionicons name={point.icon} size={18} color={colors.primary} />
            <Text style={styles.label}>{point.label}</Text>
          </View>
        ))}
      </View>
    </WebPageEnter>
  );
}

export function WebLandingPricing() {
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl * 2.5,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    atmosphere: {
      ...webOnlyStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 55% 50% at 50% 20%, rgba(74, 154, 255, 0.1) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(152, 150, 255, 0.06) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 55% 50% at 50% 20%, rgba(26, 111, 212, 0.08) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(88, 86, 214, 0.05) 0%, transparent 50%)',
      } as object),
    },
    inner: {
      position: 'relative' as const,
      zIndex: 1,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl + spacing.sm,
      alignItems: 'center' as const,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      maxWidth: 520,
    },
    cards: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.lg,
      alignItems: isWide ? ('stretch' as const) : ('stretch' as const),
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>For clinics</Text>
          <Text style={styles.title}>Start free, upgrade when you need more</Text>
          <Text style={styles.subtitle}>
            Post your first role and fill-in at no cost. Professionals always join free.
          </Text>
        </View>

        <View style={styles.cards}>
          {PLANS.map((entry, index) => (
            <PricingPlanCard
              key={entry.plan}
              plan={entry.plan}
              isRecommended={entry.isRecommended}
              enterDelayMs={80 + index * 80}
            />
          ))}
        </View>

        <PricingTrustStrip />
      </View>
    </View>
  );
}

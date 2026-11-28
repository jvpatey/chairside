import { FILL_IN_FREE_POSTS_PER_CLINIC, FILL_IN_PRICE_CAD } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { WebMarketingSectionHeader } from '@/components/web/marketing/WebMarketingSnapshotShell.web';
import { webCardLiftBase, webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type PricingCardKind = 'professional' | 'clinic';

const CREDIT_PRICE = FILL_IN_PRICE_CAD.toFixed(2);
const FREE_POSTS = FILL_IN_FREE_POSTS_PER_CLINIC;

const TRUST_POINTS = [
  { icon: 'leaf-outline' as const, label: 'No subscription' },
  { icon: 'briefcase-outline' as const, label: 'Posting roles is free' },
  { icon: 'card-outline' as const, label: 'Pay per fill-in' },
] as const;

const PROFESSIONAL_FEATURES = [
  'Get fill-in shifts by text',
  'Reply YES to request cover. The clinic confirms.',
  'Shift details, map, and status in the app',
  'Apply to permanent roles',
] as const;

const CLINIC_FEATURES = [
  'Post roles for free, no limits',
  `${FREE_POSTS} free fill-ins to start`,
  `Multi-location groups get ${FREE_POSTS} free fill-ins per location`,
  'Drafts are always free',
  'Cancel within 15 minutes and the credit goes back to your balance',
] as const;

function PricingOfferCard({ kind }: { kind: PricingCardKind }) {
  const { colors, isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const isProfessional = kind === 'professional';
  const title = isProfessional ? 'Professionals' : 'Clinics';
  const icon = isProfessional ? ('person-outline' as const) : ('business-outline' as const);
  const tagline = isProfessional ? 'Free to use' : 'Post roles free. Pay per fill-in.';
  const features = isProfessional ? PROFESSIONAL_FEATURES : CLINIC_FEATURES;

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
      backgroundColor: colors.primarySubtle,
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
  }));

  return (
    <WebPageEnter style={styles.cardWrap} trigger="visible">
      <View style={[styles.card, liftStyle]} {...hoverHandlers}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>CA$</Text>
              <Text style={styles.priceAmount}>{isProfessional ? '0' : CREDIT_PRICE}</Text>
              {isProfessional ? null : <Text style={styles.pricePeriod}>/fill-in</Text>}
            </View>
            <Text style={styles.priceSecondary}>
              {isProfessional ? 'No subscription' : 'Charged when the fill-in goes live'}
            </Text>
          </View>

          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color={colors.primary}
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
    <WebPageEnter delayMs={320}>
      <View style={styles.strip}>
        {TRUST_POINTS.map((point) => (
          <View key={point.label} style={styles.item}>
            <Ionicons name={point.icon} size={16} color={colors.tertiary} />
            <Text style={styles.label}>{point.label}</Text>
          </View>
        ))}
      </View>
    </WebPageEnter>
  );
}

export function WebLandingPricing() {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ spacing }) => ({
    bleed: {
      paddingTop: spacing.xl * 1.25,
      paddingBottom: spacing.xl * 2.5,
      overflow: 'hidden' as const,
    },
    cards: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.lg,
      alignItems: 'stretch' as const,
    },
  }));

  return (
    <WebMarketingSection style={styles.bleed} sectionId="pricing">
      <WebPageEnter>
        <WebMarketingSectionHeader
          eyebrow="Pricing"
          title="No subscription. Pay per fill-in."
          subtitle="Free for professionals. Clinics post roles for free and pay only for fill-ins that go live."
          align="center"
        />
      </WebPageEnter>

      <WebPageEnter delayMs={180}>
        <View style={styles.cards}>
          <PricingOfferCard kind="professional" />
          <PricingOfferCard kind="clinic" />
        </View>
      </WebPageEnter>

      <PricingTrustStrip />
    </WebMarketingSection>
  );
}

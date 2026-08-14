import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { WelcomeHeroFillInCard } from '@/components/onboarding/WelcomeHeroFillInCard.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { getWelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { webCardLiftBase, webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const HERO_FEATURE = {
  icon: FILL_IN_ICON.outline,
  title: 'Fill chairs, same day',
  highlight: 'same day',
  subtitle: 'Built for same-day coverage',
  body: 'Post a fill-in shift and get qualified applicants fast. Screening filters candidates before you open a message.',
};

const SATELLITE_FEATURES = [
  {
    id: 'availability',
    icon: FILL_IN_ICON.outline,
    title: "Let clinics know you're free",
    highlight: "you're free",
    body: 'Turn on fill-in mode, get discovered nearby, and get alerts when shifts open.',
  },
  {
    id: 'matches',
    icon: 'sparkles-outline' as const,
    title: 'Better matches from the start',
    highlight: 'matches',
    body: 'Candidate profiles and match scores help clinics compare fit in seconds.',
  },
  {
    id: 'groups',
    icon: 'people-outline' as const,
    title: 'Multi-location groups',
    highlight: 'groups',
    body: 'Invite managers, assign locations, and keep hiring in one place across your practices.',
  },
] as const;

function HighlightTitle({
  title,
  highlight,
  variant = 'satellite',
}: {
  title: string;
  highlight?: string;
  variant?: 'hero' | 'satellite';
}) {
  const { colors } = useTheme();
  const fontSize = variant === 'hero' ? 28 : 18;
  const lineHeight = variant === 'hero' ? 34 : 24;

  if (!highlight || !title.includes(highlight)) {
    return (
      <Text
        style={{
          fontSize,
          lineHeight,
          fontWeight: '700',
          color: colors.labelPrimary,
        }}
      >
        {title}
      </Text>
    );
  }

  const [before, after] = title.split(highlight);
  return (
    <Text
      style={{
        fontSize,
        lineHeight,
        fontWeight: '700',
        color: colors.labelPrimary,
      }}
    >
      {before}
      <Text style={{ color: colors.primary }}>{highlight}</Text>
      {after}
    </Text>
  );
}

function FeatureCardHeader({
  icon,
  title,
  highlight,
  subtitle,
  variant = 'satellite',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  highlight?: string;
  subtitle?: string;
  variant?: 'hero' | 'satellite';
}) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      gap: variant === 'hero' ? spacing.xs : 2,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
    },
    subtitle: {
      fontSize: variant === 'hero' ? 13 : 15,
      lineHeight: variant === 'hero' ? 18 : 22,
      fontWeight: variant === 'hero' ? ('600' as const) : ('400' as const),
      letterSpacing: variant === 'hero' ? 0.3 : 0,
      textTransform: variant === 'hero' ? ('uppercase' as const) : undefined,
      color: variant === 'hero' ? colors.primary : colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <View style={styles.titleWrap}>
          <HighlightTitle title={title} highlight={highlight} variant={variant} />
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function FeatureFillInSnapshot() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  return <WelcomeHeroFillInCard preview={preview} />;
}

function FeatureHeroCard() {
  const { isWide } = useResponsiveLayout();
  const { isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      borderRadius: 24,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.lg,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'raised') } as object),
    },
    layout: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.xl,
      alignItems: isWide ? ('center' as const) : ('stretch' as const),
    },
    copy: {
      flex: isWide ? 1 : undefined,
      gap: spacing.lg,
      minWidth: 0,
    },
    preview: {
      flex: isWide ? 1 : undefined,
      width: '100%' as const,
      maxWidth: isWide ? 420 : undefined,
      alignSelf: isWide ? ('stretch' as const) : ('stretch' as const),
    },
    body: {
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter trigger="visible">
      <View style={[styles.card, liftStyle]} {...hoverHandlers}>
        <View style={styles.layout}>
          <View style={styles.copy}>
            <FeatureCardHeader
              icon={HERO_FEATURE.icon}
              title={HERO_FEATURE.title}
              highlight={HERO_FEATURE.highlight}
              subtitle={HERO_FEATURE.subtitle}
              variant="hero"
            />
            <Text style={styles.body}>{HERO_FEATURE.body}</Text>
          </View>
          <View style={styles.preview}>
            <FeatureFillInSnapshot />
          </View>
        </View>
      </View>
    </WebPageEnter>
  );
}

function FeatureSatelliteCard({
  feature,
  enterDelayMs,
}: {
  feature: (typeof SATELLITE_FEATURES)[number];
  enterDelayMs?: number;
}) {
  const { isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      borderRadius: 20,
      padding: spacing.lg + 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.md,
      minHeight: 200,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1 }} trigger="visible">
      <View style={[styles.card, liftStyle]} {...hoverHandlers}>
        <FeatureCardHeader
          icon={feature.icon}
          title={feature.title}
          highlight={feature.highlight}
        />
        <Text style={styles.body}>{feature.body}</Text>
      </View>
    </WebPageEnter>
  );
}

export function WebLandingFeatures() {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    bleed: {
      paddingVertical: spacing.xl * 2.5,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      ...webOnlyStyle({
        backgroundImage: `linear-gradient(180deg, ${colors.fillSubtle} 0%, transparent 120px)`,
      } as object),
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl + spacing.sm,
      maxWidth: 520,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
    satellites: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  }));

  return (
    <WebMarketingSection style={styles.bleed} sectionId="features">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Features</Text>
        <Text style={styles.title}>Built for how dental teams actually work</Text>
        <Text style={styles.subtitle}>
          Permanent roles and same-day fill-ins — for clinics hiring and professionals finding work.
        </Text>
      </View>

      <FeatureHeroCard />

      <View style={styles.satellites}>
        {SATELLITE_FEATURES.map((feature, index) => (
          <FeatureSatelliteCard key={feature.id} feature={feature} enterDelayMs={120 + index * 80} />
        ))}
      </View>
    </WebMarketingSection>
  );
}

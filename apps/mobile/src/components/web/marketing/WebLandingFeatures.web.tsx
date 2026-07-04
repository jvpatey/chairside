import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webCardLiftBase, webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const WEB_SCREENSHOT = require('../../../../assets/images/web_screenshot.png');
const SCREENSHOT_ASPECT_RATIO = 3008 / 1602;

const HERO_FEATURE = {
  icon: 'calendar-outline' as const,
  title: 'Fill chairs, same day',
  highlight: 'same day',
  body: 'Post a fill-in shift and get qualified applicants fast. Screening filters candidates before you open a message.',
  microProof: 'Built for same-day coverage',
};

const SATELLITE_FEATURES = [
  {
    id: 'availability',
    icon: 'flash-outline' as const,
    title: "Let clinics know you're free",
    highlight: "you're free",
    body: 'Turn on fill-in mode and get discovered by nearby clinics instantly.',
  },
  {
    id: 'matches',
    icon: 'sparkles-outline' as const,
    title: 'Better matches from the start',
    highlight: 'matches',
    body: 'Application kits and match insights help clinics compare fit in seconds.',
  },
  {
    id: 'hiring',
    icon: 'chatbubbles-outline' as const,
    title: 'The hiring process — streamlined',
    highlight: 'streamlined',
    body: 'Messages, interviews, and offers — without the email thread spiral.',
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

function FeatureHeroVisual() {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    wrap: {
      flex: 1,
      minWidth: 0,
      position: 'relative' as const,
    },
    glow: {
      position: 'absolute' as const,
      top: '8%',
      left: '6%',
      right: '6%',
      bottom: '8%',
      borderRadius: 24,
      pointerEvents: 'none' as const,
      // @ts-expect-error web gradient
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(74, 154, 255, 0.2) 0%, transparent 70%)'
        : 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(26, 111, 212, 0.14) 0%, transparent 70%)',
    },
    shell: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'floating') } as object),
    },
    chrome: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.fillSubtle,
    },
    frame: {
      width: '100%' as const,
      aspectRatio: SCREENSHOT_ASPECT_RATIO,
      backgroundColor: colors.backgroundGrouped,
    },
    screenshot: {
      width: '100%' as const,
      height: '100%' as const,
      // @ts-expect-error web-only
      objectFit: 'cover',
      objectPosition: 'top center',
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.shell}>
        <View style={styles.chrome}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.frame}>
          <Image
            source={WEB_SCREENSHOT}
            style={styles.screenshot}
            resizeMode="cover"
            accessibilityRole="image"
            accessibilityLabel="Chairside fill-in shift workflow"
          />
        </View>
      </View>
    </View>
  );
}

function FeatureHeroCard() {
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      borderRadius: 24,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.xl,
      overflow: 'hidden' as const,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'raised') } as object),
      ...(isWide
        ? ({
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
          } as object)
        : {}),
    },
    copy: {
      flex: isWide ? 1 : undefined,
      gap: spacing.md,
      maxWidth: isWide ? 420 : undefined,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primarySubtle,
    },
    body: {
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
    },
    microProof: {
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      color: colors.primary,
      textTransform: 'uppercase' as const,
    },
    visual: {
      flex: isWide ? 1.15 : undefined,
      width: '100%' as const,
    },
  }));

  return (
    <WebPageEnter>
      <View style={styles.card}>
        <View style={styles.copy}>
          <View style={styles.iconWrap}>
            <Ionicons name={HERO_FEATURE.icon} size={24} color={colors.primary} />
          </View>
          <Text style={styles.microProof}>{HERO_FEATURE.microProof}</Text>
          <HighlightTitle
            title={HERO_FEATURE.title}
            highlight={HERO_FEATURE.highlight}
            variant="hero"
          />
          <Text style={styles.body}>{HERO_FEATURE.body}</Text>
        </View>
        <View style={styles.visual}>
          <FeatureHeroVisual />
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
  const { colors, isDark } = useTheme();

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
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primarySubtle,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1 }}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={feature.icon} size={20} color={colors.primary} />
        </View>
        <HighlightTitle title={feature.title} highlight={feature.highlight} variant="satellite" />
        <Text style={styles.body}>{feature.body}</Text>
      </View>
    </WebPageEnter>
  );
}

export function WebLandingFeatures() {
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl * 2,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      // @ts-expect-error web gradient band
      backgroundImage: `linear-gradient(180deg, ${colors.fillSubtle} 0%, transparent 120px)`,
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
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Features</Text>
        <Text style={styles.title}>Built for how dental teams actually work</Text>
        <Text style={styles.subtitle}>
          One platform for clinics hiring and professionals finding work — starting with same-day
          fill-ins.
        </Text>
      </View>

      <FeatureHeroCard />

      <View style={styles.satellites}>
        {SATELLITE_FEATURES.map((feature, index) => (
          <FeatureSatelliteCard key={feature.id} feature={feature} enterDelayMs={120 + index * 80} />
        ))}
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import {
  APP_STORE_COMING_SOON_HINT,
  APP_STORE_COMING_SOON_LABEL,
  ONBOARDING_SUBTITLE,
} from '@/constants';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import {
  webChipHoverStyles,
  webHover,
  webPointer,
  webTextLinkHoverStyles,
  webTileHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const HERO_HEADLINE = 'Staffing for dental clinics, simplified.';

const FEATURES = [
  {
    icon: 'calendar-outline' as const,
    title: 'Fill chairs, same day',
    titleHighlight: 'same day',
    body: 'Post a fill-in shift and get qualified applicants instantly. Built-in screening questions filter candidates before you even open a message.',
  },
  {
    icon: 'flash-outline' as const,
    title: "Let clinics know you're free",
    titleHighlight: "you're free",
    body: "Turn on fill-in mode and let nearby clinics know you're available right now. No job board, no waiting—just work.",
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'The hiring process — streamlined',
    titleHighlight: 'streamlined',
    body: 'Messaging, interviews, and offers stay in one place. No email threads, no phone tag.',
  },
] as const;

const ROLE_BADGES = [
  { label: 'For clinics', icon: 'business-outline' as const },
  { label: 'For dental professionals', icon: 'medical-outline' as const },
] as const;

const FOOTER_YEAR = new Date().getFullYear();

type FeatureCardProps = {
  icon: (typeof FEATURES)[number]['icon'];
  title: string;
  titleHighlight?: string;
  body: string;
  enterDelayMs?: number;
};

function FeatureTitle({ title, highlight }: { title: string; highlight?: string }) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    highlight: {
      color: colors.primary,
    },
  }));

  if (!highlight) {
    return <Text style={styles.title}>{title}</Text>;
  }

  const highlightIndex = title.indexOf(highlight);
  if (highlightIndex < 0) {
    return <Text style={styles.title}>{title}</Text>;
  }

  const before = title.slice(0, highlightIndex);
  const after = title.slice(highlightIndex + highlight.length);

  return (
    <Text style={styles.title}>
      {before}
      <Text style={styles.highlight}>{highlight}</Text>
      {after}
    </Text>
  );
}

function FeatureCard({ icon, title, titleHighlight, body, enterDelayMs = 0 }: FeatureCardProps) {
  const { colors } = useTheme();
  const [cardHovered, setCardHovered] = useState(false);
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      flex: 1,
      minWidth: 240,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
      // @ts-expect-error — boxShadow is web-only
      boxShadow: isDark
        ? '0 8px 24px rgba(0, 0, 0, 0.25)'
        : '0 4px 16px rgba(0, 0, 0, 0.06)',
      // @ts-expect-error — transition is web-only
      transitionProperty: 'background-color, border-color, box-shadow, transform',
      transitionDuration: '160ms',
      transitionTimingFunction: 'ease',
    },
    cardHovered: {
      ...webTileHoverStyles(colors, isDark),
      // @ts-expect-error — transform is web-only
      transform: [{ translateY: -2 }],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    body: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1, minWidth: 240 }}>
      <View
        style={[styles.card, cardHovered && styles.cardHovered]}
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <FeatureTitle title={title} highlight={titleHighlight} />
        <Text style={styles.body}>{body}</Text>
      </View>
    </WebPageEnter>
  );
}

export function WelcomeWebLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isWide = width >= BREAKPOINTS.regular;
  const scrollRef = useRef<ScrollView>(null);
  const featuresOffsetY = useRef(0);

  const scrollToFeatures = useCallback(() => {
    scrollRef.current?.scrollTo({ y: featuresOffsetY.current, animated: true });
  }, []);

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    heroWrapper: {
      position: 'relative' as const,
      width: '100%',
      alignSelf: 'center' as const,
      overflow: 'hidden' as const,
    },
    heroBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // @ts-expect-error — web-only gradient layers
      backgroundImage: isDark
        ? isWide
          ? `radial-gradient(ellipse 55% 60% at 18% 0%, rgba(74, 154, 255, 0.24) 0%, transparent 58%), radial-gradient(ellipse 50% 45% at 82% 20%, rgba(152, 150, 255, 0.12) 0%, transparent 55%), linear-gradient(180deg, #0c1018 0%, ${colors.background} 48%)`
          : `radial-gradient(ellipse 90% 70% at 50% -15%, rgba(74, 154, 255, 0.22) 0%, transparent 58%), radial-gradient(ellipse 45% 35% at 88% 18%, rgba(152, 150, 255, 0.1) 0%, transparent 52%), linear-gradient(180deg, #0c1018 0%, ${colors.background} 42%)`
        : isWide
          ? `radial-gradient(ellipse 55% 60% at 18% 0%, rgba(26, 111, 212, 0.16) 0%, transparent 58%), radial-gradient(ellipse 50% 45% at 82% 20%, rgba(88, 86, 214, 0.08) 0%, transparent 55%), linear-gradient(180deg, #f4f8fc 0%, ${colors.background} 42%)`
          : `radial-gradient(ellipse 90% 70% at 50% -15%, rgba(26, 111, 212, 0.14) 0%, transparent 58%), radial-gradient(ellipse 45% 35% at 12% 22%, rgba(88, 86, 214, 0.07) 0%, transparent 52%), linear-gradient(180deg, #f4f8fc 0%, ${colors.background} 38%)`,
    },
    hero: {
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: isWide ? spacing.xl * 2 : spacing.xl,
      // @ts-expect-error — minHeight vh is web-only
      minHeight: isWide ? '92vh' : '100vh',
      maxWidth: isWide ? CONTENT_MAX_WIDTH.wide : 680,
      width: '100%',
      alignSelf: 'center' as const,
    },
    heroGrid: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: isWide ? ('center' as const) : ('center' as const),
      justifyContent: isWide ? ('space-between' as const) : ('center' as const),
      gap: isWide ? spacing.xl * 1.5 : spacing.lg,
      width: '100%',
    },
    heroLeft: {
      flex: isWide ? 0.95 : undefined,
      alignItems: isWide ? ('flex-start' as const) : ('center' as const),
      justifyContent: 'center' as const,
      gap: spacing.lg,
      maxWidth: isWide ? 460 : undefined,
      width: isWide ? undefined : ('100%' as const),
    },
    heroRight: {
      flex: isWide ? 1.25 : undefined,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: isWide ? 560 : undefined,
      width: isWide ? undefined : ('100%' as const),
    },
    heroCopy: {
      alignItems: isWide ? ('flex-start' as const) : ('center' as const),
      gap: spacing.lg,
      width: '100%',
    },
    wordmarkWrap: {
      marginBottom: spacing.xs,
      alignSelf: isWide ? ('flex-start' as const) : ('center' as const),
    },
    headline: {
      ...typography.subtitle,
      fontSize: isWide ? 34 : 24,
      lineHeight: isWide ? 42 : 32,
      fontWeight: '600' as const,
      textAlign: isWide ? ('left' as const) : ('center' as const),
      letterSpacing: -0.4,
      color: colors.labelPrimary,
      maxWidth: isWide ? 480 : 480,
      alignSelf: isWide ? ('flex-start' as const) : ('center' as const),
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: isWide ? 18 : 16,
      lineHeight: isWide ? 28 : 24,
      textAlign: isWide ? ('left' as const) : ('center' as const),
      color: colors.labelSecondary,
      maxWidth: isWide ? 480 : 520,
      marginTop: -spacing.xs,
      alignSelf: isWide ? ('flex-start' as const) : ('center' as const),
    },
    ctaRow: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: isWide ? ('flex-start' as const) : ('stretch' as const),
      justifyContent: isWide ? ('flex-start' as const) : ('center' as const),
      gap: spacing.md,
      width: isWide ? undefined : ('100%' as const),
      maxWidth: isWide ? 420 : 420,
      alignSelf: isWide ? ('flex-start' as const) : ('stretch' as const),
    },
    ctaPrimary: {
      flex: isWide ? undefined : undefined,
      width: isWide ? undefined : ('100%' as const),
      minWidth: isWide ? 168 : undefined,
    },
    ctaSecondary: {
      flex: isWide ? undefined : undefined,
      width: isWide ? undefined : ('100%' as const),
      minWidth: isWide ? 140 : undefined,
    },
    roleBadges: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      justifyContent: isWide ? ('flex-start' as const) : ('center' as const),
      gap: spacing.sm,
      alignSelf: isWide ? ('flex-start' as const) : ('center' as const),
    },
    roleBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      ...webPointer(),
    },
    roleBadgeHovered: webChipHoverStyles(colors),
    roleBadgePressed: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    roleBadgeText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.labelPrimary,
    },
    mobileAppPitch: {
      alignItems: 'center' as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    mobileAppPitchTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    mobileAppPitchHint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    scrollHint: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      marginTop: isWide ? 0 : spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      alignSelf: isWide ? ('flex-start' as const) : ('center' as const),
      ...webPointer(),
    },
    scrollHintHovered: webChipHoverStyles(colors),
    scrollHintPressed: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    scrollHintText: {
      fontSize: 13,
      color: colors.labelSecondary,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
    },
    featuresSection: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH.wide,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl * 2,
      gap: spacing.lg,
      backgroundColor: colors.background,
    },
    featuresHeader: {
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    featuresTitle: {
      ...typography.title,
      fontSize: isWide ? 28 : 24,
      textAlign: 'center' as const,
    },
    featuresSubtitle: {
      ...typography.subtitle,
      textAlign: 'center' as const,
      maxWidth: 480,
    },
    featureGrid: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.lg,
      alignItems: 'stretch' as const,
    },
    footer: {
      width: '100%',
      alignSelf: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.background,
    },
    footerRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      maxWidth: 560,
    },
    footerDivider: {
      fontSize: 13,
      color: colors.labelTertiary,
      lineHeight: 20,
    },
    footerLinkPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    footerLinkHovered: webTextLinkHoverStyles(colors),
    footerLink: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    footerLinkPressed: {
      color: colors.primary,
    },
    footerCopyright: {
      fontSize: 13,
      color: colors.labelTertiary,
    },
  }));

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.page}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrapper}>
        <View style={styles.heroBackground} pointerEvents="none" />
        <View style={[styles.hero, { paddingTop: insets.top + (isWide ? 48 : 32) }]}>
          <View style={styles.heroGrid}>
            <View style={styles.heroLeft}>
              <View style={styles.heroCopy}>
                <WebPageEnter delayMs={0} style={styles.wordmarkWrap}>
                  <ChairsideWordmark
                    variant="hero"
                    align={isWide ? 'left' : 'center'}
                    animateSideOnHover
                  />
                </WebPageEnter>
                <WebPageEnter delayMs={80}>
                  <Text style={styles.headline}>{HERO_HEADLINE}</Text>
                </WebPageEnter>
                <WebPageEnter delayMs={160}>
                  <Text style={styles.subtitle}>{ONBOARDING_SUBTITLE}</Text>
                </WebPageEnter>
              </View>

              <WebPageEnter delayMs={240} style={styles.ctaRow}>
                <OnboardingButton
                  label="Get started"
                  onPress={() => router.push('/(onboarding)/role')}
                  style={styles.ctaPrimary}
                />
                <OnboardingButton
                  label="Sign in"
                  variant="ghost"
                  onPress={() => router.push('/(onboarding)/sign-in')}
                  style={styles.ctaSecondary}
                />
              </WebPageEnter>

              <WebPageEnter delayMs={320} style={styles.roleBadges}>
                {ROLE_BADGES.map(({ label, icon }) => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    onPress={() => router.push('/(onboarding)/role')}
                    style={({ pressed, hovered }) => [
                      styles.roleBadge,
                      webHover(hovered, pressed, styles.roleBadgeHovered),
                      pressed && styles.roleBadgePressed,
                    ]}>
                    <Ionicons name={icon} size={16} color={colors.primary} />
                    <Text style={styles.roleBadgeText}>{label}</Text>
                  </Pressable>
                ))}
              </WebPageEnter>

              {!isWide ? (
                <WebPageEnter delayMs={360} style={styles.mobileAppPitch}>
                  <Text style={styles.mobileAppPitchTitle}>{APP_STORE_COMING_SOON_LABEL}</Text>
                  <Text style={styles.mobileAppPitchHint}>{APP_STORE_COMING_SOON_HINT}</Text>
                </WebPageEnter>
              ) : null}

              <WebPageEnter delayMs={400}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See features"
                  accessibilityHint="Scrolls to the features section"
                  onPress={scrollToFeatures}
                  style={({ pressed, hovered }) => [
                    styles.scrollHint,
                    webHover(hovered, pressed, styles.scrollHintHovered),
                    pressed && styles.scrollHintPressed,
                  ]}>
                  <Text style={styles.scrollHintText}>See features</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.labelSecondary} />
                </Pressable>
              </WebPageEnter>
            </View>

            {isWide ? (
              <WebPageEnter delayMs={280} style={styles.heroRight}>
                <WelcomeHeroAppPanel />
              </WebPageEnter>
            ) : null}
          </View>
        </View>
      </View>

      <View
        style={styles.featuresSection}
        onLayout={(event) => {
          featuresOffsetY.current = event.nativeEvent.layout.y;
        }}>
        <WebPageEnter delayMs={480} style={styles.featuresHeader}>
          <Text style={styles.featuresTitle}>
            Staffing built for dental clinics and professionals
          </Text>
          <Text style={styles.featuresSubtitle}>
            Everything clinics and professionals need to hire, apply, and coordinate—without
            the back-and-forth.
          </Text>
        </WebPageEnter>
        <View style={styles.featureGrid}>
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              titleHighlight={feature.titleHighlight}
              body={feature.body}
              enterDelayMs={560 + index * 80}
            />
          ))}
        </View>
      </View>

      <WebPageEnter delayMs={800} style={styles.footer}>
        <View style={styles.footerRow}>
          <ChairsideWordmark variant="small" align="left" />
          <Text style={styles.footerDivider} accessibilityElementsHidden importantForAccessibility="no">
            ·
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityHint="Opens the sign in screen"
            onPress={() => router.push('/(onboarding)/sign-in')}
            style={({ pressed, hovered }) => [
              styles.footerLinkPressable,
              webHover(hovered, pressed, styles.footerLinkHovered),
              pressed && { opacity: 0.75 },
            ]}>
            {({ pressed }) => (
              <Text style={[styles.footerLink, pressed && styles.footerLinkPressed]}>Sign in</Text>
            )}
          </Pressable>
          <Text style={styles.footerDivider} accessibilityElementsHidden importantForAccessibility="no">
            ·
          </Text>
          <Text style={styles.footerCopyright}>© {FOOTER_YEAR} Chairside</Text>
        </View>
      </WebPageEnter>
    </ScrollView>
  );
}

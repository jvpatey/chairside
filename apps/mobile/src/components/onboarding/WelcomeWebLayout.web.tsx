import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useBounceLoop } from '@/lib/webMotion.web';
import { useTheme, useThemedStyles } from '@/theme';

const HERO_HEADLINE = 'Staffing for dental clinics, simplified.';

const FEATURES = [
  {
    icon: 'calendar-outline' as const,
    title: 'Fill chairs, same day',
    body: 'Post a fill-in shift and get qualified applicants instantly. Built-in screening questions filter candidates before you even open a message.',
  },
  {
    icon: 'flash-outline' as const,
    title: 'Signal availability instantly',
    body: 'Turn on fill-in mode and let nearby clinics know you\'re available right now. No job board, no waiting—just work.',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'From offer to done, in one place',
    body: 'Messaging, interview scheduling, and offers are all built in. No emails, no phone tag.',
  },
] as const;

const ROLE_BADGES = [
  { label: 'For clinics', icon: 'business-outline' as const },
  { label: 'For dental professionals', icon: 'medical-outline' as const },
] as const;

type FeatureCardProps = {
  icon: (typeof FEATURES)[number]['icon'];
  title: string;
  body: string;
  enterDelayMs?: number;
};

function ScrollHint({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bounceY = useBounceLoop(4);

  return (
    <Animated.View style={[style, { transform: [{ translateY: bounceY }] }]}>
      {children}
    </Animated.View>
  );
}

function FeatureCard({ icon, title, body, enterDelayMs = 0 }: FeatureCardProps) {
  const { colors } = useTheme();
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
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
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
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
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

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    hero: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: isWide ? spacing.xl * 2 : spacing.xl,
      // @ts-expect-error — minHeight vh is web-only
      minHeight: '100vh',
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center' as const,
      gap: spacing.lg,
    },
    heroCopy: {
      alignItems: 'center' as const,
      gap: spacing.md,
      width: '100%',
    },
    headline: {
      ...typography.title,
      fontSize: isWide ? 40 : 32,
      lineHeight: isWide ? 48 : 38,
      textAlign: 'center' as const,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: isWide ? 18 : 16,
      lineHeight: isWide ? 28 : 24,
      textAlign: 'center' as const,
      color: colors.labelSecondary,
      maxWidth: 520,
    },
    ctaRow: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.md,
      width: '100%',
      maxWidth: 420,
    },
    ctaPrimary: {
      flex: isWide ? 1 : undefined,
      width: isWide ? undefined : ('100%' as const),
      minWidth: isWide ? 160 : undefined,
    },
    ctaSecondary: {
      flex: isWide ? 1 : undefined,
      width: isWide ? undefined : ('100%' as const),
      minWidth: isWide ? 140 : undefined,
    },
    roleBadges: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
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
    },
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
    scrollHint: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    scrollHintText: {
      fontSize: 13,
      color: colors.labelTertiary,
      fontWeight: '500' as const,
    },
    featuresSection: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH.wide,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl * 2,
      gap: spacing.lg,
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
  }));

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { paddingTop: insets.top + (isWide ? 48 : 32) }]}>
        <View style={styles.heroCopy}>
          <WebPageEnter delayMs={0}>
            <ChairsideWordmark variant="hero" align="center" />
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
              style={({ pressed }) => [styles.roleBadge, pressed && styles.roleBadgePressed]}>
              <Ionicons name={icon} size={16} color={colors.primary} />
              <Text style={styles.roleBadgeText}>{label}</Text>
            </Pressable>
          ))}
        </WebPageEnter>

        <WebPageEnter delayMs={400} style={styles.scrollHint}>
          <ScrollHint style={styles.scrollHint}>
            <Text style={styles.scrollHintText}>See features</Text>
            <Ionicons name="chevron-down" size={16} color={colors.labelTertiary} />
          </ScrollHint>
        </WebPageEnter>
      </View>

      <View style={styles.featuresSection}>
        <WebPageEnter delayMs={480} style={styles.featuresHeader}>
          <Text style={styles.featuresTitle}>Built for how dental teams work</Text>
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
              body={feature.body}
              enterDelayMs={560 + index * 80}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

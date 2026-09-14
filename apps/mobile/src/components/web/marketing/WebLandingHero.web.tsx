import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebLandingHeroHeadline } from '@/components/web/marketing/WebLandingHeroHeadline.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import {
  webHover,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webSectionEyebrowStyle, webTypography } from '@/theme/web';

/** Clear sticky marketing nav + breathing room above hero content. */
const NAV_CLEARANCE = 72;
const PREVIEW_VERTICAL_RESERVE = NAV_CLEARANCE + 96;

const HERO_CHECKS = [
  'Free to start',
  'Roles and fill-ins',
  'Built for Canadian dental teams',
] as const;

const BLURB =
  'Confirm coverage before the day starts — post a fill-in and nearby professionals get notified.';

function LandingHeroSubtitle() {
  const styles = useThemedStyles(({ colors }) => ({
    text: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
      maxWidth: 480,
    },
    fillIn: {
      color: colors.secondary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
  }));

  return (
    <Text style={styles.text}>
      Confirm coverage before the day starts — post a{' '}
      <Text style={styles.fillIn}>fill-in</Text> and nearby professionals get notified.
    </Text>
  );
}

function LandingHeroCheckRow() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
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
    <View style={styles.row}>
      {HERO_CHECKS.map((label) => (
        <View key={label} style={styles.item}>
          <Ionicons name="checkmark-circle" size={16} color={colors.tertiary} />
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Phone web: centered wordmark → blurb → CTAs (Finora-style spacing). */
function MobileWebLandingHero({ windowHeight }: { windowHeight: number }) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + NAV_CLEARANCE;
  const bottomPad = Math.max(topPad, insets.bottom + 24);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      justifyContent: 'flex-start' as const,
      paddingTop: topPad,
      paddingBottom: bottomPad,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      height: windowHeight,
      minHeight: Math.max(520, windowHeight),
    },
    atmosphere: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 80% 60% at 50% 12%, rgba(152, 150, 255, 0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74, 154, 255, 0.12) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 80% 60% at 50% 12%, rgba(88, 86, 214, 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(26, 111, 212, 0.08) 0%, transparent 50%)',
      } as object),
    },
    column: {
      flex: 1,
      maxWidth: 420,
      width: '100%' as const,
      alignSelf: 'center' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: spacing.xl,
    },
    brandBlock: {
      alignItems: 'center' as const,
      gap: spacing.md,
      width: '100%' as const,
    },
    wordmarkGlow: {
      position: 'absolute' as const,
      top: -24,
      width: 220,
      height: 220,
      borderRadius: 110,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(circle at center, rgba(152, 150, 255, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle at center, rgba(88, 86, 214, 0.14) 0%, transparent 70%)',
      } as object),
    },
    wordmarkWrap: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 64,
    },
    headlineWrap: {
      alignItems: 'center' as const,
      width: '100%' as const,
    },
    headline: {
      ...webTypography.title,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    blurb: {
      ...webTypography.bodyLg,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      maxWidth: 340,
    },
    actions: {
      width: '100%' as const,
      gap: spacing.md,
      alignItems: 'stretch' as const,
      marginTop: spacing.sm,
    },
    primaryButton: {
      alignSelf: 'stretch' as const,
      width: '100%' as const,
    },
    signInRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    signInMuted: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    signInLink: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    signInLinkHovered: webTextLinkHoverStyles(colors),
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <WebPageEnter style={styles.column}>
        <View style={styles.brandBlock}>
          <View style={styles.wordmarkWrap}>
            <View style={styles.wordmarkGlow} />
            <ChairsideWordmark variant="hero" align="center" />
          </View>
          <View style={styles.headlineWrap}>
            <WebLandingHeroHeadline style={styles.headline} align="center" />
          </View>
          <Text style={styles.blurb}>{BLURB}</Text>
        </View>

        <View style={styles.actions}>
          <OnboardingButton
            label="Get started"
            onPress={() => router.push('/(onboarding)/role')}
            variant="primary"
            style={styles.primaryButton}
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            onPress={() => router.push('/(onboarding)/sign-in')}
            style={({ pressed }) => [styles.signInRow, pressed && { opacity: 0.75 }]}
          >
            {({ hovered }) => (
              <>
                <Text style={styles.signInMuted}>Already have an account?</Text>
                <Text
                  style={[
                    styles.signInLink,
                    webHover(hovered, false, styles.signInLinkHovered),
                  ]}
                >
                  Sign in
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </WebPageEnter>
    </View>
  );
}

function DesktopWebLandingHero({ windowHeight }: { windowHeight: number }) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      justifyContent: 'center' as const,
      paddingTop: insets.top + NAV_CLEARANCE,
      paddingBottom: spacing.xl * 1.5,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      overflow: 'visible' as const,
      minHeight: Math.max(640, windowHeight),
    },
    atmosphere: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 80% 60% at 18% 0%, rgba(152, 150, 255, 0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 82% 18%, rgba(74, 154, 255, 0.14) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 80% 60% at 18% 0%, rgba(88, 86, 214, 0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 82% 18%, rgba(26, 111, 212, 0.1) 0%, transparent 50%)',
      } as object),
    },
    inner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xl * 2,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    copy: {
      flex: 1,
      gap: spacing.lg,
      maxWidth: 560,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    headline: {
      ...webTypography.displaySm,
      color: colors.labelPrimary,
    },
    ctaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      flexWrap: 'wrap' as const,
    },
    ctaButton: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
    },
    visual: {
      flex: 1.1,
      minWidth: 420,
      overflow: 'visible' as const,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <View style={styles.inner}>
        <WebPageEnter style={styles.copy}>
          <Text style={styles.eyebrow}>Same-day dental coverage</Text>
          <WebLandingHeroHeadline style={styles.headline} />
          <LandingHeroSubtitle />
          <View style={styles.ctaRow}>
            <OnboardingButton
              label="Get started for free"
              onPress={() => router.push('/(onboarding)/role')}
              variant="primary"
              style={styles.ctaButton}
            />
            <OnboardingButton
              label="Sign in"
              onPress={() => router.push('/(onboarding)/sign-in')}
              variant="secondary"
              style={styles.ctaButton}
            />
          </View>
          <LandingHeroCheckRow />
        </WebPageEnter>
        <WebPageEnter delayMs={180} style={styles.visual}>
          <WelcomeHeroAppPanel
            maxHeight={Math.max(
              380,
              windowHeight - insets.top - PREVIEW_VERTICAL_RESERVE,
            )}
          />
        </WebPageEnter>
      </View>
    </View>
  );
}

export function WebLandingHero() {
  const { height: windowHeight } = useWindowDimensions();
  const { isWide } = useResponsiveLayout();

  if (!isWide) {
    return <MobileWebLandingHero windowHeight={windowHeight} />;
  }

  return <DesktopWebLandingHero windowHeight={windowHeight} />;
}

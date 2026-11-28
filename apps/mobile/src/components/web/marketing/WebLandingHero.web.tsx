import { router } from 'expo-router';
import { Pressable, Text, type TextStyle, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroFlowPhone } from '@/components/onboarding/WelcomeHeroFlowPhone.web';
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
import { fontSemibold, useThemedStyles } from '@/theme';
import { webSectionEyebrowStyle, webTypography } from '@/theme/web';

/** Clear sticky marketing nav + breathing room above hero content. */
const NAV_CLEARANCE = 72;

function LandingHeroSubtitle({ align = 'left' }: { align?: 'left' | 'center' }) {
  const styles = useThemedStyles(({ colors }) => ({
    text: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
      maxWidth: 480,
      textAlign: align,
    },
    yes: {
      color: colors.labelPrimary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
  }));

  return (
    <Text style={styles.text}>
      Post a fill-in and nearby professionals get it by text. <Text style={styles.yes}>You choose who covers.</Text>
    </Text>
  );
}

/** Phone web: wordmark → headline → blurb → CTAs → looping phone demo. */
function MobileWebLandingHero({ windowHeight }: { windowHeight: number }) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + NAV_CLEARANCE;
  const bottomPad = Math.max(insets.bottom + 24, 32);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      justifyContent: 'flex-start' as const,
      paddingTop: topPad,
      paddingBottom: bottomPad,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      minHeight: Math.max(720, windowHeight),
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
          ? 'radial-gradient(ellipse 80% 60% at 50% 12%, rgba(74, 154, 255, 0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59, 138, 232, 0.12) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 80% 60% at 50% 12%, rgba(26, 111, 212, 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59, 138, 232, 0.08) 0%, transparent 50%)',
      } as object),
    },
    column: {
      flex: 1,
      maxWidth: 420,
      width: '100%' as const,
      alignSelf: 'center' as const,
      justifyContent: 'flex-start' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
      paddingTop: spacing.md,
    },
    brandBlock: {
      alignItems: 'center' as const,
      gap: spacing.sm,
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
          ? 'radial-gradient(circle at center, rgba(74, 154, 255, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle at center, rgba(26, 111, 212, 0.14) 0%, transparent 70%)',
      } as object),
    },
    wordmarkWrap: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 56,
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
    blurbWrap: {
      width: '100%' as const,
      alignItems: 'center' as const,
    },
    actions: {
      width: '100%' as const,
      gap: spacing.sm,
      alignItems: 'stretch' as const,
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
    phoneWrap: {
      width: '100%' as const,
      alignItems: 'center' as const,
      marginTop: spacing.xs,
    },
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
          <View style={styles.blurbWrap}>
            <LandingHeroSubtitle align="center" />
          </View>
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
                    webHover(hovered, false, styles.signInLinkHovered) as TextStyle | false,
                  ]}
                >
                  Sign in
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.phoneWrap}>
          <WelcomeHeroFlowPhone size="default" />
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
      minHeight: Math.max(680, windowHeight),
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
          ? 'radial-gradient(ellipse 80% 60% at 18% 0%, rgba(74, 154, 255, 0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 82% 18%, rgba(59, 138, 232, 0.14) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 80% 60% at 18% 0%, rgba(26, 111, 212, 0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 82% 18%, rgba(59, 138, 232, 0.1) 0%, transparent 50%)',
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
      flex: 1.05,
      minWidth: 300,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <View style={styles.inner}>
        <WebPageEnter style={styles.copy}>
          <Text style={styles.eyebrow}>Same-day cover</Text>
          <WebLandingHeroHeadline style={styles.headline} />
          <LandingHeroSubtitle />
          <View style={styles.ctaRow}>
            <OnboardingButton
              label="Get started"
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
        </WebPageEnter>
        <WebPageEnter delayMs={180} style={styles.visual}>
          <WelcomeHeroFlowPhone size="hero" />
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

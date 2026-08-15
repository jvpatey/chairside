import { router } from 'expo-router';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebLandingHeroHeadline } from '@/components/web/marketing/WebLandingHeroHeadline.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { fontSemibold, useThemedStyles } from '@/theme';
import { webSectionEyebrowStyle, webTypography } from '@/theme/web';

/** Clear sticky marketing nav + breathing room above hero content. */
const NAV_CLEARANCE = 72;
const PREVIEW_VERTICAL_RESERVE = NAV_CLEARANCE + 96;

function LandingHeroSubtitle() {
  const styles = useThemedStyles(({ colors }) => ({
    text: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
      maxWidth: 480,
    },
    fillIn: {
      color: colors.primary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
    roles: {
      color: colors.labelSecondary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
  }));

  return (
    <Text style={styles.text}>
      When someone calls out, post a <Text style={styles.fillIn}>fill-in</Text> and confirm
      coverage fast. <Text style={styles.roles}>Permanent roles</Text> are here too — one place
      for clinics and professionals.
    </Text>
  );
}

export function WebLandingHero() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      justifyContent: 'center' as const,
      paddingTop: insets.top + NAV_CLEARANCE,
      paddingBottom: spacing.xl * 1.5,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      overflow: 'visible' as const,
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
          ? 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(74, 154, 255, 0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(74, 154, 255, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(26, 111, 212, 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(26, 111, 212, 0.08) 0%, transparent 50%)',
      } as object),
    },
    inner: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: isWide ? ('center' as const) : ('stretch' as const),
      gap: isWide ? spacing.xl * 2 : spacing.xl,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    copy: {
      flex: isWide ? 1 : undefined,
      gap: spacing.lg,
      maxWidth: isWide ? 560 : undefined,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    headline: {
      ...(isWide ? webTypography.displaySm : webTypography.headline),
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
      flex: isWide ? 1.1 : undefined,
      minWidth: isWide ? 420 : undefined,
      overflow: 'visible' as const,
    },
  }));

  return (
    <View
      style={[
        styles.section,
        { minHeight: Math.max(isWide ? 640 : 520, windowHeight) },
      ]}>
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
        </WebPageEnter>
        <WebPageEnter delayMs={120} style={styles.visual}>
          <WelcomeHeroAppPanel
            maxHeight={
              isWide
                ? Math.max(380, windowHeight - insets.top - PREVIEW_VERTICAL_RESERVE)
                : undefined
            }
          />
        </WebPageEnter>
      </View>
    </View>
  );
}

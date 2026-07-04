import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebLandingHeroHeadline } from '@/components/web/marketing/WebLandingHeroHeadline.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useTheme, useThemedStyles } from '@/theme';
import { webSectionEyebrowStyle, webTypography } from '@/theme/web';

export function WebLandingHero() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    section: {
      minHeight: isWide ? 680 : 560,
      paddingTop: insets.top + 96,
      paddingBottom: spacing.xl * 2,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    },
    atmosphere: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      // @ts-expect-error web gradient
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(74, 154, 255, 0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(152, 150, 255, 0.12) 0%, transparent 50%)'
        : 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(26, 111, 212, 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(88, 86, 214, 0.08) 0%, transparent 50%)',
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
    subtitle: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
      maxWidth: 480,
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
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <View style={styles.inner}>
        <WebPageEnter style={styles.copy}>
          <Text style={styles.eyebrow}>Dental staffing platform</Text>
          <WebLandingHeroHeadline style={styles.headline} />
          <Text style={styles.subtitle}>{ONBOARDING_SUBTITLE}</Text>
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
          <WelcomeHeroAppPanel />
        </WebPageEnter>
      </View>
    </View>
  );
}

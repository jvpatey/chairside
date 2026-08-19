import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

/** Slim closing conversion band — a strip, not a billboard. */
export function WebLandingCtaStrip() {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.xl * 1.5,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    band: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: isWide ? ('center' as const) : ('flex-start' as const),
      justifyContent: 'space-between' as const,
      gap: spacing.lg,
      paddingVertical: spacing.lg + 4,
      paddingHorizontal: spacing.xl,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      position: 'relative' as const,
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
          ? 'radial-gradient(ellipse 60% 120% at 8% 50%, rgba(152, 150, 255, 0.14) 0%, transparent 60%), radial-gradient(ellipse 50% 110% at 92% 50%, rgba(74, 154, 255, 0.1) 0%, transparent 55%)'
          : 'radial-gradient(ellipse 60% 120% at 8% 50%, rgba(88, 86, 214, 0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 110% at 92% 50%, rgba(26, 111, 212, 0.06) 0%, transparent 55%)',
      } as object),
    },
    copy: {
      flex: isWide ? 1 : undefined,
      minWidth: 0,
      gap: 2,
      zIndex: 1,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    button: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
      zIndex: 1,
    },
  }));

  return (
    <View style={styles.section}>
      <WebPageEnter style={{ width: '100%' }} trigger="visible">
        <View style={styles.band}>
          <View style={styles.atmosphere} />
          <View style={styles.copy}>
            <Text style={styles.title}>Need someone today?</Text>
            <Text style={styles.subtitle}>
              Post a fill-in and get cover requests fast — free to start.
            </Text>
          </View>
          <OnboardingButton
            label="Create free account"
            onPress={() => router.push('/(onboarding)/role')}
            variant="primary"
            style={styles.button}
          />
        </View>
      </WebPageEnter>
    </View>
  );
}

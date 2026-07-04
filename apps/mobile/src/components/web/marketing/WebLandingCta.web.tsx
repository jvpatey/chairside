import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useTheme, useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

export function WebLandingCta() {
  const { colors, isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      paddingVertical: spacing.xl * 2,
      paddingHorizontal: spacing.xl,
      borderRadius: 28,
      alignItems: 'center' as const,
      gap: spacing.lg,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      // @ts-expect-error web gradient
      backgroundImage: isDark
        ? 'linear-gradient(135deg, rgba(74, 154, 255, 0.18) 0%, rgba(152, 150, 255, 0.12) 50%, rgba(28, 28, 30, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(26, 111, 212, 0.12) 0%, rgba(88, 86, 214, 0.08) 50%, rgba(255, 255, 255, 0.95) 100%)',
      borderWidth: 1,
      borderColor: colors.separator,
    },
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      maxWidth: 480,
    },
    actions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    ctaButton: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
    },
  }));

  return (
    <WebPageEnter>
      <View style={styles.section}>
        <Text style={styles.title}>Ready to simplify dental staffing?</Text>
        <Text style={styles.subtitle}>
          Join clinics and professionals across Canada who use Chairside to hire, find work, and fill
          shifts.
        </Text>
        <View style={styles.actions}>
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
      </View>
    </WebPageEnter>
  );
}

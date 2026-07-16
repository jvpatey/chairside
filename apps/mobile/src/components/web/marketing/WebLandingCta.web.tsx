import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { APP_STORE_COMING_SOON_HINT } from '@/constants';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

export function WebLandingCta() {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    card: {
      paddingVertical: spacing.xl * 1.75,
      paddingHorizontal: spacing.xl,
      borderRadius: 28,
      alignItems: 'center' as const,
      gap: spacing.lg,
      width: '100%' as const,
      borderWidth: 1,
      borderColor: colors.separator,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'linear-gradient(135deg, rgba(74, 154, 255, 0.18) 0%, rgba(152, 150, 255, 0.12) 50%, rgba(28, 28, 30, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(26, 111, 212, 0.12) 0%, rgba(88, 86, 214, 0.08) 50%, rgba(255, 255, 255, 0.95) 100%)',
      } as object),
    },
    copy: {
      alignItems: 'center' as const,
      gap: spacing.sm,
      maxWidth: 520,
    },
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    appNote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
      maxWidth: 420,
    },
    ctaButton: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
    },
  }));

  return (
    <View style={styles.section}>
      <WebPageEnter style={{ width: '100%' }}>
        <View style={styles.card}>
          <View style={styles.copy}>
            <Text style={styles.title}>Post a role or find your next one</Text>
            <Text style={styles.subtitle}>
              Join free in minutes — set up as a clinic or a professional.
            </Text>
          </View>
          <OnboardingButton
            label="Create free account"
            onPress={() => router.push('/(onboarding)/role')}
            variant="primary"
            style={styles.ctaButton}
          />
          <Text style={styles.appNote}>{APP_STORE_COMING_SOON_HINT}</Text>
        </View>
      </WebPageEnter>
    </View>
  );
}

import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

export function WebLandingCta() {
  const styles = useThemedStyles(({ colors, spacing }) => ({
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
      backgroundColor: colors.surface,
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
    ctaButton: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
    },
  }));

  return (
    <View style={styles.section}>
      <WebPageEnter style={{ width: '100%' }} trigger="visible">
        <View style={styles.card}>
          <View style={styles.copy}>
            <Text style={styles.title}>Need coverage today?</Text>
            <Text style={styles.subtitle}>
              Post a fill-in or turn on availability — free to start.
            </Text>
          </View>
          <OnboardingButton
            label="Create free account"
            onPress={() => router.push('/(onboarding)/role')}
            variant="primary"
            style={styles.ctaButton}
          />
        </View>
      </WebPageEnter>
    </View>
  );
}

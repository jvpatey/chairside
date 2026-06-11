import { Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useThemedStyles } from '@/theme';

export function WelcomeHero() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    wordmarkWrap: {
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    headline: {
      ...typography.title,
      fontSize: 28,
      lineHeight: 34,
      textAlign: 'center',
      letterSpacing: -0.35,
      maxWidth: 320,
      marginTop: spacing.xs,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      lineHeight: 23,
      textAlign: 'center',
      maxWidth: 330,
    },
    audienceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    audiencePill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    audienceText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.wordmarkWrap}>
        <ChairsideWordmark variant="hero" />
      </View>
      <Text style={styles.headline}>Dental staffing, simplified.</Text>
      <Text style={styles.subtitle}>{ONBOARDING_SUBTITLE}</Text>
      <View style={styles.audienceRow}>
        <View style={styles.audiencePill}>
          <Text style={styles.audienceText}>For clinics</Text>
        </View>
        <View style={styles.audiencePill}>
          <Text style={styles.audienceText}>For dental pros</Text>
        </View>
      </View>
    </View>
  );
}

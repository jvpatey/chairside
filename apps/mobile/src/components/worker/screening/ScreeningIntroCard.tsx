import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

export function ScreeningIntroCard() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700',
    },
    body: typography.subtitle,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Screening questions</Text>
      <Text style={styles.title}>A few quick questions</Text>
      <Text style={styles.body}>
        This clinic uses screening questions before reviewing full applications. Answer each
        question to submit your screening responses.
      </Text>
    </View>
  );
}

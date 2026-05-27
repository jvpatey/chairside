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
      <Text style={styles.eyebrow}>Culture fit</Text>
      <Text style={styles.title}>A few quick questions</Text>
      <Text style={styles.body}>
        This clinic included a short culture fit questionnaire. You can skip if you prefer.
      </Text>
    </View>
  );
}

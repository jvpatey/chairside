import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type YesNoQuestionCardProps = {
  prompt: string;
  value?: boolean;
  onChange: (value: boolean) => void;
};

export function YesNoQuestionCard({ prompt, value, onChange }: YesNoQuestionCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    prompt: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
    },
    options: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.separator,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundGrouped,
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    optionTextSelected: {
      color: colors.primaryOnPrimary,
    },
  }));

  const select = (next: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(next);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.options}>
        <Pressable
          style={[styles.option, value === true && styles.optionSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: value === true }}
          onPress={() => select(true)}>
          <Text style={[styles.optionText, value === true && styles.optionTextSelected]}>Yes</Text>
        </Pressable>
        <Pressable
          style={[styles.option, value === false && styles.optionSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: value === false }}
          onPress={() => select(false)}>
          <Text style={[styles.optionText, value === false && styles.optionTextSelected]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

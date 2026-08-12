import { Text, TextInput, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type TextQuestionCardProps = {
  prompt: string;
  value?: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export function TextQuestionCard({
  prompt,
  value = '',
  onChange,
  compact = false,
}: TextQuestionCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 14 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: compact ? spacing.sm : spacing.md,
      gap: compact ? spacing.sm : spacing.md,
    },
    prompt: {
      ...typography.body,
      fontSize: compact ? 14 : 15,
      lineHeight: compact ? 20 : 22,
    },
    input: {
      fontSize: typography.body.fontSize,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      minHeight: compact ? 80 : 96,
      textAlignVertical: 'top',
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Type your answer"
        multiline
        autoCapitalize="sentences"
        accessibilityLabel={prompt}
      />
    </View>
  );
}

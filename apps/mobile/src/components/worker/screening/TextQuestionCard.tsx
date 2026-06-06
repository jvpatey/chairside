import { Text, TextInput, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type TextQuestionCardProps = {
  prompt: string;
  value?: string;
  onChange: (value: string) => void;
};

export function TextQuestionCard({ prompt, value = '', onChange }: TextQuestionCardProps) {
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
    input: {
      fontSize: typography.body.fontSize,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      minHeight: 96,
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

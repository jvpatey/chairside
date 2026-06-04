import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type NumberQuestionCardProps = {
  prompt: string;
  value?: number;
  min?: number;
  max?: number;
  unitLabel?: string;
  onChange: (value: number) => void;
};

export function NumberQuestionCard({
  prompt,
  value,
  min = 0,
  max = 99,
  unitLabel,
  onChange,
}: NumberQuestionCardProps) {
  const [text, setText] = useState(value != null ? String(value) : '');

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
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: typography.body.fontSize,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      minHeight: 48,
    },
    unit: {
      ...typography.subtitle,
      fontSize: 15,
      fontWeight: '600',
      minWidth: 48,
    },
  }));

  const commit = (raw: string) => {
    setText(raw);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={commit}
          keyboardType="number-pad"
          placeholder="0"
          maxLength={String(max).length + 1}
          accessibilityLabel={prompt}
        />
        {unitLabel ? <Text style={styles.unit}>{unitLabel}</Text> : null}
      </View>
    </View>
  );
}

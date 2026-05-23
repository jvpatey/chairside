import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

function sanitizeHourlyRate(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

export function formatCompensation(rate: string): string {
  const trimmed = rate.trim();
  return trimmed ? `$${trimmed}/hr` : '';
}

export function parseCompensation(value: string): string {
  const match = /^\$(\d+)\/hr$/.exec(value.trim());
  return match?.[1] ?? '';
}

type CompensationInputProps = {
  onChange: (compensation: string) => void;
  initialValue?: string;
};

export function CompensationInput({ onChange, initialValue }: CompensationInputProps) {
  const { colors } = useTheme();
  const [rate, setRate] = useState(() => parseCompensation(initialValue ?? ''));
  const preview = formatCompensation(rate);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    prefix: {
      fontSize: typography.body.fontSize,
      color: colors.labelSecondary,
    },
    input: {
      flex: 1,
      fontSize: typography.body.fontSize,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    suffix: {
      fontSize: typography.body.fontSize,
      color: colors.labelSecondary,
    },
    preview: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    previewText: typography.body,
  }));

  useEffect(() => {
    onChange(preview);
  }, [preview, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Compensation (optional)</Text>

      <View style={styles.row}>
        <Text style={styles.prefix}>$</Text>
        <TextInput
          style={styles.input}
          placeholder="45"
          placeholderTextColor={colors.labelTertiary}
          value={rate}
          onChangeText={(value) => setRate(sanitizeHourlyRate(value))}
          keyboardType="number-pad"
          accessibilityLabel="Hourly compensation"
        />
        <Text style={styles.suffix}>/hr</Text>
      </View>

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Compensation preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

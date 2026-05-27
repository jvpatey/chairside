import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

function sanitizeWageInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

export function formatWageRange(min: string, max: string): string {
  const minValue = min.trim();
  const maxValue = max.trim();

  if (!minValue && !maxValue) return '';
  if (minValue && maxValue) {
    if (minValue === maxValue) return `$${minValue}/hr`;
    return `$${minValue}–$${maxValue}/hr`;
  }
  if (minValue) return `From $${minValue}/hr`;
  return `Up to $${maxValue}/hr`;
}

export function parseWageRange(wageRange: string): { min: string; max: string } {
  const range = wageRange.trim();
  const rangeMatch = /^\$(\d+)–\$(\d+)\/hr$/.exec(range);
  if (rangeMatch) return { min: rangeMatch[1], max: rangeMatch[2] };

  const fromMatch = /^From \$(\d+)\/hr$/.exec(range);
  if (fromMatch) return { min: fromMatch[1], max: '' };

  const upToMatch = /^Up to \$(\d+)\/hr$/.exec(range);
  if (upToMatch) return { min: '', max: upToMatch[1] };

  const singleMatch = /^\$(\d+)\/hr$/.exec(range);
  if (singleMatch) return { min: singleMatch[1], max: singleMatch[1] };

  return { min: '', max: '' };
}

type WageRangeInputProps = {
  onChange: (wageRange: string) => void;
  initialValue?: string;
};

export function WageRangeInput({ onChange, initialValue }: WageRangeInputProps) {
  const { colors } = useTheme();
  const parsedInitial = parseWageRange(initialValue ?? '');
  const [min, setMin] = useState(parsedInitial.min);
  const [max, setMax] = useState(parsedInitial.max);

  const preview = formatWageRange(min, max);
  const isInvalid = Boolean(min && max && Number(min) > Number(max));

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
    fieldBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    input: {
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
    inputError: {
      borderColor: colors.destructive,
    },
    prefix: {
      fontSize: typography.body.fontSize,
      color: colors.labelSecondary,
      marginTop: 22,
    },
    suffix: {
      fontSize: typography.body.fontSize,
      color: colors.labelSecondary,
      marginTop: 22,
    },
    dash: {
      fontSize: 14,
      color: colors.labelSecondary,
      marginTop: 22,
    },
    error: {
      ...typography.subtitle,
      color: colors.destructive,
      fontSize: 13,
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
    onChange(isInvalid ? '' : preview);
  }, [preview, isInvalid, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Wage range (optional)</Text>

      <View style={styles.row}>
        <Text style={styles.prefix}>$</Text>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Min</Text>
          <TextInput
            style={[styles.input, isInvalid && styles.inputError]}
            placeholder="Low"
            placeholderTextColor={colors.labelTertiary}
            value={min}
            onChangeText={(value) => setMin(sanitizeWageInput(value))}
            keyboardType="number-pad"
            accessibilityLabel="Minimum hourly wage"
          />
        </View>
        <Text style={styles.dash}>–</Text>
        <Text style={styles.prefix}>$</Text>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Max</Text>
          <TextInput
            style={[styles.input, isInvalid && styles.inputError]}
            placeholder="High"
            placeholderTextColor={colors.labelTertiary}
            value={max}
            onChangeText={(value) => setMax(sanitizeWageInput(value))}
            keyboardType="number-pad"
            accessibilityLabel="Maximum hourly wage"
          />
        </View>
        <Text style={styles.suffix}>/hr</Text>
      </View>

      {isInvalid ? <Text style={styles.error}>Maximum wage must be greater than minimum.</Text> : null}

      {preview && !isInvalid ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Wage preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

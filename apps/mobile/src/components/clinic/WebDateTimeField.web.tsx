import { createElement, useMemo } from 'react';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type WebDateFieldProps = {
  label?: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
};

type WebTimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

function useWebDateTimeFieldStyles() {
  return useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.xs },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: typography.body.fontSize,
      color: colors.labelPrimary,
      width: '100%',
    },
  }));
}

export function WebDateField({ label, value, min, onChange }: WebDateFieldProps) {
  const styles = useWebDateTimeFieldStyles();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {createElement('input', {
        type: 'date',
        value,
        min,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
        style: styles.input,
      })}
    </View>
  );
}

function normalizeTimeValue(value: string): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  return `${match[1]!.padStart(2, '0')}:${match[2]}`;
}

export function WebTimeField({ label, value, onChange }: WebTimeFieldProps) {
  const styles = useWebDateTimeFieldStyles();
  const normalizedValue = useMemo(() => normalizeTimeValue(value), [value]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {createElement('input', {
        type: 'time',
        value: normalizedValue,
        onChange: (event: { target: { value: string } }) =>
          onChange(normalizeTimeValue(event.target.value)),
        style: styles.input,
      })}
    </View>
  );
}

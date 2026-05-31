import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { useTheme, useThemedStyles } from '@/theme';

export type RolePayType = 'hourly' | 'commission';

export const COMMISSION_WAGE_LABEL = 'Commission';

function sanitizePayInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

function formatHourlyRange(min: string, max: string): string {
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

export function formatWageRange(min: string, max: string, payType: RolePayType = 'hourly'): string {
  if (payType === 'commission') {
    return COMMISSION_WAGE_LABEL;
  }
  return formatHourlyRange(min, max);
}

export function parseWageRange(wageRange: string): {
  min: string;
  max: string;
  payType: RolePayType;
} {
  const range = wageRange.trim();
  if (!range) return { min: '', max: '', payType: 'hourly' };

  if (range === COMMISSION_WAGE_LABEL || /^commission$/i.test(range) || /commission/i.test(range)) {
    const legacyAmountMatch = /^\$(\d+) commission$/.exec(range);
    return {
      min: legacyAmountMatch?.[1] ?? '',
      max: '',
      payType: 'commission',
    };
  }

  const rangeMatch = /^\$(\d+)–\$(\d+)\/hr$/.exec(range);
  if (rangeMatch) return { min: rangeMatch[1], max: rangeMatch[2], payType: 'hourly' };

  const fromMatch = /^From \$(\d+)\/hr$/.exec(range);
  if (fromMatch) return { min: fromMatch[1], max: '', payType: 'hourly' };

  const upToMatch = /^Up to \$(\d+)\/hr$/.exec(range);
  if (upToMatch) return { min: '', max: upToMatch[1], payType: 'hourly' };

  const singleMatch = /^\$(\d+)\/hr$/.exec(range);
  if (singleMatch) return { min: singleMatch[1], max: singleMatch[1], payType: 'hourly' };

  return { min: '', max: '', payType: 'hourly' };
}

const PAY_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'commission', label: 'Commission' },
];

type WageRangeInputProps = {
  onChange: (wageRange: string) => void;
  initialValue?: string;
};

export function WageRangeInput({ onChange, initialValue }: WageRangeInputProps) {
  const { colors } = useTheme();
  const parsedInitial = parseWageRange(initialValue ?? '');
  const [payType, setPayType] = useState<RolePayType>(parsedInitial.payType);
  const [min, setMin] = useState(parsedInitial.min);
  const [max, setMax] = useState(parsedInitial.max);

  const preview = formatWageRange(min, max, payType);
  const isInvalid =
    payType === 'hourly' && Boolean(min && max && Number(min) > Number(max));

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    hourlyRow: {
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
    inputFixed: {
      fontSize: typography.body.fontSize,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      textAlign: 'center',
      minWidth: 96,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    prefixHourly: {
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

  const handlePayTypeChange = (value: string) => {
    const nextType = value as RolePayType;
    setPayType(nextType);
    if (nextType === 'commission') {
      setMin('');
      setMax('');
    }
  };

  useEffect(() => {
    onChange(isInvalid ? '' : preview);
  }, [preview, isInvalid, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Compensation (optional)</Text>

      <ChipSelector
        options={PAY_TYPE_OPTIONS}
        selected={payType}
        onChange={handlePayTypeChange}
      />

      {payType === 'hourly' ? (
        <View style={styles.hourlyRow}>
          <Text style={styles.prefixHourly}>$</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Min</Text>
            <TextInput
              style={[styles.inputFixed, isInvalid && styles.inputError]}
              placeholder="Low"
              placeholderTextColor={colors.labelTertiary}
              value={min}
              onChangeText={(value) => setMin(sanitizePayInput(value))}
              keyboardType="number-pad"
              accessibilityLabel="Minimum hourly wage"
            />
          </View>
          <Text style={styles.dash}>–</Text>
          <Text style={styles.prefixHourly}>$</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Max</Text>
            <TextInput
              style={[styles.inputFixed, isInvalid && styles.inputError]}
              placeholder="High"
              placeholderTextColor={colors.labelTertiary}
              value={max}
              onChangeText={(value) => setMax(sanitizePayInput(value))}
              keyboardType="number-pad"
              accessibilityLabel="Maximum hourly wage"
            />
          </View>
          <Text style={styles.suffix}>/hr</Text>
        </View>
      ) : null}

      {isInvalid ? (
        <Text style={styles.error}>Maximum wage must be greater than minimum.</Text>
      ) : null}

      {preview && !isInvalid ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Compensation preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

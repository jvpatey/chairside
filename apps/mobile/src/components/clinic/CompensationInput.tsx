import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import {
  formFieldInputRowStyle,
  formFieldInputStyle,
} from '@/theme/formFieldTokens';
import { useTheme, useThemedStyles } from '@/theme';

export type FillInPayType = 'hourly' | 'flat' | 'discuss';

const PAY_TYPE_OPTIONS: { value: FillInPayType; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'flat', label: 'Flat rate' },
  { value: 'discuss', label: 'To be discussed' },
];

function sanitizeRate(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function formatCompensation(rate: string, payType: FillInPayType = 'hourly'): string {
  if (payType === 'discuss') return '';
  const trimmed = rate.trim();
  if (!trimmed) return '';
  if (payType === 'flat') return `$${trimmed} flat`;
  return `$${trimmed}/hr`;
}

export function parseCompensation(value: string): { rate: string; payType: FillInPayType } {
  const trimmed = value.trim();
  if (!trimmed) return { rate: '', payType: 'discuss' };

  const hourlyMatch = /^\$(\d+)\/hr$/.exec(trimmed);
  if (hourlyMatch) return { rate: hourlyMatch[1], payType: 'hourly' };

  const flatMatch = /^\$(\d+)\s*flat$/i.exec(trimmed);
  if (flatMatch) return { rate: flatMatch[1], payType: 'flat' };

  // Legacy bare dollar amounts treated as flat.
  const bareMatch = /^\$(\d+)$/.exec(trimmed);
  if (bareMatch) return { rate: bareMatch[1], payType: 'flat' };

  return { rate: '', payType: 'discuss' };
}

type CompensationInputProps = {
  onChange: (compensation: string) => void;
  initialValue?: string;
  embedded?: boolean;
};

export function CompensationInput({
  onChange,
  initialValue,
  embedded = false,
}: CompensationInputProps) {
  const { colors } = useTheme();
  const parsedInitial = parseCompensation(initialValue ?? '');
  const [payType, setPayType] = useState<FillInPayType>(parsedInitial.payType);
  const [rate, setRate] = useState(parsedInitial.rate);
  const preview = formatCompensation(rate, payType);

  const styles = useThemedStyles((theme) => ({
    wrap: {
      gap: theme.spacing.sm,
    },
    row: formFieldInputRowStyle(theme),
    prefix: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.labelSecondary,
      paddingLeft: theme.spacing.md,
    },
    input: {
      ...formFieldInputStyle(theme),
      textAlign: 'center' as const,
    },
    suffix: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.labelSecondary,
      paddingRight: theme.spacing.md,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.labelSecondary,
    },
    preview: {
      backgroundColor: theme.colors.fillSubtle,
      borderRadius: 12,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.colors.labelSecondary,
    },
    previewText: theme.typography.body,
  }));

  const handlePayTypeChange = (value: FillInPayType | FillInPayType[]) => {
    const nextType = (Array.isArray(value) ? value[0] : value) as FillInPayType;
    setPayType(nextType);
    if (nextType === 'discuss') {
      setRate('');
    }
  };

  useEffect(() => {
    onChange(preview);
  }, [preview, onChange]);

  return (
    <View style={styles.wrap}>
      {!embedded ? <FormFieldLabel label="Compensation (optional)" /> : null}

      <ChipSelector
        options={PAY_TYPE_OPTIONS}
        selected={payType}
        onChange={handlePayTypeChange}
      />

      {payType === 'hourly' || payType === 'flat' ? (
        <View style={styles.row}>
          <Text style={styles.prefix}>$</Text>
          <TextInput
            style={styles.input}
            placeholder="Rate"
            placeholderTextColor={colors.labelTertiary}
            value={rate}
            onChangeText={(value) => setRate(sanitizeRate(value))}
            keyboardType="number-pad"
            accessibilityLabel={payType === 'flat' ? 'Flat compensation' : 'Hourly compensation'}
          />
          <Text style={styles.suffix}>{payType === 'flat' ? 'flat' : '/hr'}</Text>
        </View>
      ) : null}

      {payType === 'discuss' ? (
        <Text style={styles.hint}>Pay won’t appear on the listing.</Text>
      ) : null}

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Compensation preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

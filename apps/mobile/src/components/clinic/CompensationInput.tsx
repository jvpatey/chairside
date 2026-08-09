import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import {
  formFieldInputRowStyle,
  formFieldInputStyle,
} from '@/theme/formFieldTokens';
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
  embedded?: boolean;
};

export function CompensationInput({ onChange, initialValue, embedded = false }: CompensationInputProps) {
  const { colors } = useTheme();
  const [rate, setRate] = useState(() => parseCompensation(initialValue ?? ''));
  const preview = formatCompensation(rate);

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
    preview: {
      backgroundColor: theme.colors.fillSubtle,
      borderRadius: 12,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.labelSecondary,
    },
    previewText: theme.typography.body,
  }));

  useEffect(() => {
    onChange(preview);
  }, [preview, onChange]);

  return (
    <View style={styles.wrap}>
      {!embedded ? <FormFieldLabel label="Compensation (optional)" /> : null}

      <View style={styles.row}>
        <Text style={styles.prefix}>$</Text>
        <TextInput
          style={styles.input}
          placeholder="Rate"
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

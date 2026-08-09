import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { WebDateField } from '@/components/clinic/WebDateTimeField.web';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import {
  addDays,
  formatShiftDateLabel,
  parseISODate,
  startOfDay,
  toISODate,
  todayISO,
} from '@/lib/dates';
import { useThemedStyles, type GradientAccent } from '@/theme';

const SHIFT_DATE_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: 'tomorrow' as const, label: 'Tomorrow' },
  { value: 'custom' as const, label: 'Custom' },
] as const;

export type ShiftDateMode = (typeof SHIFT_DATE_OPTIONS)[number]['value'];

type ShiftDateInputProps = {
  value: string;
  onChange: (isoDate: string) => void;
  accent?: GradientAccent;
  required?: boolean;
  embedded?: boolean;
  onPickerOpenChange?: (open: boolean) => void;
};

function resolveMode(value: string): ShiftDateMode {
  if (value === todayISO()) return 'today';
  if (value === toISODate(addDays(startOfDay(new Date()), 1))) return 'tomorrow';
  return 'custom';
}

export function ShiftDateInput({
  value,
  onChange,
  accent = 'primary',
  required = false,
  embedded = false,
  onPickerOpenChange,
}: ShiftDateInputProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [mode, setMode] = useState<ShiftDateMode>(() => resolveMode(value || todayISO()));
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const selectedDate = parseISODate(value) ?? today;
  const minDate = todayISO();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.sm },
    dateDisplay: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    dateDisplayLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    dateDisplayText: {
      ...typography.body,
      fontWeight: '600',
    },
  }));

  const handleModeChange = (nextMode: ShiftDateMode) => {
    setMode(nextMode);
    if (nextMode === 'today') {
      setCustomPickerOpen(false);
      onChange(todayISO());
      return;
    }
    if (nextMode === 'tomorrow') {
      setCustomPickerOpen(false);
      onChange(toISODate(addDays(today, 1)));
      return;
    }
    setCustomPickerOpen(true);
  };

  const handlePickerOpenChange = (open: boolean) => {
    setCustomPickerOpen(open);
    onPickerOpenChange?.(open);
  };

  return (
    <View style={styles.wrap}>
      {!embedded ? <FormFieldLabel label="Shift date" required={required} /> : null}
      <ChipSelector
        options={[...SHIFT_DATE_OPTIONS]}
        selected={mode}
        onChange={(next) => handleModeChange(next as ShiftDateMode)}
        accent={accent}
      />
      {mode === 'custom' ? (
        <WebDateField
          label="Selected date"
          value={value || todayISO()}
          min={minDate}
          onChange={onChange}
          hint="Tap to select date"
          accent={accent}
          autoOpen={customPickerOpen}
          onOpenChange={handlePickerOpenChange}
        />
      ) : (
        <View style={styles.dateDisplay}>
          <Text style={styles.dateDisplayLabel}>Selected date</Text>
          <Text style={styles.dateDisplayText}>{formatShiftDateLabel(selectedDate)}</Text>
        </View>
      )}
    </View>
  );
}

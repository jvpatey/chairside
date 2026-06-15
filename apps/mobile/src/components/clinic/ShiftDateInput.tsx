import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import {
  addDays,
  formatShiftDateLabel,
  parseISODate,
  startOfDay,
  toISODate,
  todayISO,
} from '@/lib/dates';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

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
};

function resolveMode(value: string): ShiftDateMode {
  if (value === todayISO()) return 'today';
  if (value === toISODate(addDays(startOfDay(new Date()), 1))) return 'tomorrow';
  return 'custom';
}

export function ShiftDateInput({ value, onChange, accent = 'primary' }: ShiftDateInputProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const today = useMemo(() => startOfDay(new Date()), []);
  const [mode, setMode] = useState<ShiftDateMode>(() => resolveMode(value || todayISO()));
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = parseISODate(value) ?? today;
  const minDate = today;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
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
    changeDateText: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600',
    },
    pickerWrap: {
      gap: spacing.xs,
    },
    doneButton: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
  }));

  const dateDisplayActiveStyle = {
    borderWidth: 1,
    borderColor: brandColor,
    backgroundColor: brandSubtle,
  };
  const changeDateTextStyle = { color: brandColor };
  const doneTextStyle = {
    fontSize: 14,
    fontWeight: '600' as const,
    color: brandColor,
  };

  const handleModeChange = (nextMode: ShiftDateMode) => {
    setMode(nextMode);
    setShowPicker(false);

    if (nextMode === 'today') {
      onChange(todayISO());
      return;
    }

    if (nextMode === 'tomorrow') {
      onChange(toISODate(addDays(today, 1)));
    }
  };

  const handleDateDisplayPress = () => {
    if (mode !== 'custom') return;

    if (Platform.OS === 'android') {
      setShowPicker(true);
      return;
    }

    setShowPicker((current) => !current);
  };

  const handleCustomDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) return;
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (!date) return;

    const normalized = startOfDay(date);
    if (normalized.getTime() < minDate.getTime()) {
      onChange(todayISO());
      return;
    }

    onChange(toISODate(normalized));
  };

  const isCustom = mode === 'custom';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Shift date</Text>
      <ChipSelector
        options={[...SHIFT_DATE_OPTIONS]}
        selected={mode}
        onChange={(next) => handleModeChange(next as ShiftDateMode)}
        accent={accent}
      />

      <Pressable
        style={[
          styles.dateDisplay,
          isCustom && showPicker && dateDisplayActiveStyle,
        ]}
        onPress={handleDateDisplayPress}
        disabled={!isCustom}
        accessibilityRole={isCustom ? 'button' : 'text'}
        accessibilityLabel="Selected shift date"
      >
        <Text style={styles.dateDisplayLabel}>Selected date</Text>
        <Text style={styles.dateDisplayText}>{formatShiftDateLabel(selectedDate)}</Text>
        {isCustom && !showPicker ? (
          <Text style={[styles.changeDateText, changeDateTextStyle]}>Tap to select date</Text>
        ) : null}
      </Pressable>

      {isCustom && showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={minDate}
            onChange={handleCustomDateChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowPicker(false)}
              accessibilityRole="button"
              accessibilityLabel="Done selecting date"
            >
              <Text style={doneTextStyle}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import {
  formatTime12h,
  formatTime24h,
  formatTimeRangePreview,
  parseTime24h,
} from '@/lib/time';
import { useThemedStyles } from '@/theme';

export type TimeRange = {
  startTime: string;
  endTime: string;
};

type ActiveField = 'start' | 'end' | null;

type TimeRangeInputProps = {
  sectionLabel?: string;
  rowLabel?: string;
  schedule: TimeRange;
  onChange: (schedule: TimeRange) => void;
  showPreview?: boolean;
};

function displayTime(time: string): string {
  if (!time.trim()) return 'Select time';
  return formatTime12h(time) ?? time;
}

export function TimeRangeInput({
  sectionLabel,
  rowLabel,
  schedule,
  onChange,
  showPreview = false,
}: TimeRangeInputProps) {
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rowLabel: {
      width: 36,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
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
    timeButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      alignItems: 'center',
    },
    timeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    timeButtonText: {
      fontSize: typography.body.fontSize,
      color: colors.labelPrimary,
    },
    dash: {
      fontSize: 14,
      color: colors.labelSecondary,
      marginTop: 22,
    },
    pickerWrap: {
      gap: spacing.xs,
    },
    doneButton: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    doneText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
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

  const preview = formatTimeRangePreview(schedule.startTime, schedule.endTime);

  const handleFieldPress = (field: 'start' | 'end') => {
    setActiveField((current) => (current === field ? null : field));
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setActiveField(null);
      if (event.type === 'dismissed' || !date) return;
    } else if (event.type === 'dismissed') {
      setActiveField(null);
      return;
    }

    if (!date || !activeField) return;

    const nextTime = formatTime24h(date);
    if (activeField === 'start') {
      onChange({ ...schedule, startTime: nextTime });
      return;
    }
    onChange({ ...schedule, endTime: nextTime });
  };

  const pickerValue =
    activeField === 'end'
      ? (parseTime24h(schedule.endTime) ?? new Date())
      : (parseTime24h(schedule.startTime) ?? new Date());

  return (
    <View style={styles.wrap}>
      {sectionLabel ? <Text style={styles.sectionLabel}>{sectionLabel}</Text> : null}

      <View style={styles.row}>
        {rowLabel ? <Text style={styles.rowLabel}>{rowLabel}</Text> : null}

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Start</Text>
          <Pressable
            style={[styles.timeButton, activeField === 'start' && styles.timeButtonActive]}
            onPress={() => handleFieldPress('start')}
            accessibilityRole="button"
            accessibilityLabel="Start time"
          >
            <Text style={styles.timeButtonText}>{displayTime(schedule.startTime)}</Text>
          </Pressable>
        </View>

        <Text style={styles.dash}>–</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>End</Text>
          <Pressable
            style={[styles.timeButton, activeField === 'end' && styles.timeButtonActive]}
            onPress={() => handleFieldPress('end')}
            accessibilityRole="button"
            accessibilityLabel="End time"
          >
            <Text style={styles.timeButtonText}>{displayTime(schedule.endTime)}</Text>
          </Pressable>
        </View>
      </View>

      {activeField ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={styles.doneButton}
              onPress={() => setActiveField(null)}
              accessibilityRole="button"
              accessibilityLabel="Done selecting time"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPreview && preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Hours preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

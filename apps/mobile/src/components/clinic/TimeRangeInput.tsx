import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import {
  defaultEndTimeDate,
  defaultStartTimeDate,
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
  onPickerOpenChange?: (open: boolean) => void;
};

function displayTime(time: string): string {
  if (!time.trim()) return 'Select time';
  return formatTime12h(time) ?? time;
}

function pickerDateForField(field: 'start' | 'end', schedule: TimeRange): Date {
  const existing = field === 'start' ? schedule.startTime : schedule.endTime;
  return (
    parseTime24h(existing) ?? (field === 'start' ? defaultStartTimeDate() : defaultEndTimeDate())
  );
}

export function TimeRangeInput({
  sectionLabel,
  rowLabel,
  schedule,
  onChange,
  showPreview = false,
}: TimeRangeInputProps) {
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [pickerDate, setPickerDate] = useState(() => defaultStartTimeDate());

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

  const commitTime = (field: 'start' | 'end', date: Date) => {
    const nextTime = formatTime24h(date);
    if (field === 'start') {
      onChange({ ...schedule, startTime: nextTime });
      return;
    }
    onChange({ ...schedule, endTime: nextTime });
  };

  const handleFieldPress = (field: 'start' | 'end') => {
    if (activeField === field) {
      setActiveField(null);
      return;
    }

    setPickerDate(pickerDateForField(field, schedule));
    setActiveField(field);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setActiveField(null);
      if (event.type === 'dismissed' || !date || !activeField) return;
      commitTime(activeField, date);
      return;
    }

    if (event.type === 'dismissed') {
      setActiveField(null);
      return;
    }

    if (!date) return;
    setPickerDate(date);
  };

  const handleDone = () => {
    if (!activeField) return;
    commitTime(activeField, pickerDate);
    setActiveField(null);
  };

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
            value={pickerDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={styles.doneButton}
              onPress={handleDone}
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

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  defaultEndTimeDate,
  defaultStartTimeDate,
  formatTime12h,
  formatTime24h,
  formatTimeRangePreview,
  isValidTimeRange,
  parseTime24h,
} from '@/lib/time';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

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
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  embedded?: boolean;
  onPickerOpenChange?: (open: boolean) => void;
  accent?: GradientAccent;
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
  required = false,
  invalid = false,
  errorMessage,
  embedded = false,
  onPickerOpenChange,
  accent = 'primary',
}: TimeRangeInputProps) {
  const { colors } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [pickerDate, setPickerDate] = useState(() => defaultStartTimeDate());

  const rangeInvalid =
    invalid ||
    Boolean(
      schedule.startTime &&
        schedule.endTime &&
        !isValidTimeRange(schedule.startTime, schedule.endTime),
    );
  const resolvedError =
    errorMessage ??
    (rangeInvalid && schedule.startTime && schedule.endTime
      ? 'End time must be after start time.'
      : undefined);

  useEffect(() => {
    onPickerOpenChange?.(activeField != null);
  }, [activeField, onPickerOpenChange]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: isCompact ? ('column' as const) : ('row' as const),
      alignItems: isCompact ? ('stretch' as const) : ('center' as const),
      gap: spacing.sm,
    },
    rowLabel: {
      width: isCompact ? undefined : 36,
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
    timeButtonInvalid: {
      borderColor: colors.destructive,
    },
    timeButtonText: {
      fontSize: typography.body.fontSize,
      color: colors.labelPrimary,
    },
    timeButtonPlaceholder: {
      color: colors.labelSecondary,
    },
    dash: {
      fontSize: 14,
      color: colors.labelSecondary,
      alignSelf: 'center',
      marginTop: isCompact ? 0 : 22,
    },
    pickerWrap: {
      gap: spacing.xs,
    },
    doneButton: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
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
    error: {
      ...typography.subtitle,
      color: colors.destructive,
      fontSize: 13,
    },
  }));

  const timeButtonActiveStyle = {
    borderColor: brandColor,
    backgroundColor: brandSubtle,
  };
  const doneTextStyle = {
    fontSize: 14,
    fontWeight: '600' as const,
    color: brandColor,
  };

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
      const field = activeField;
      setActiveField(null);
      if (event.type === 'dismissed' || !date || !field) return;
      commitTime(field, date);
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

  const renderTimeButton = (field: 'start' | 'end', label: string) => {
    const time = field === 'start' ? schedule.startTime : schedule.endTime;
    const isEmpty = !time.trim();

    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable
          style={[
            styles.timeButton,
            activeField === field && timeButtonActiveStyle,
            rangeInvalid && styles.timeButtonInvalid,
          ]}
          onPress={() => handleFieldPress(field)}
          accessibilityRole="button"
          accessibilityLabel={`${label} time`}
        >
          <Text
            style={[styles.timeButtonText, isEmpty && styles.timeButtonPlaceholder]}
          >
            {displayTime(time)}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      {!embedded && sectionLabel ? (
        <FormFieldLabel label={sectionLabel} required={required} />
      ) : null}

      <View style={styles.row}>
        {rowLabel ? <Text style={styles.rowLabel}>{rowLabel}</Text> : null}
        {renderTimeButton('start', 'Start')}
        {!isCompact ? <Text style={styles.dash}>–</Text> : null}
        {renderTimeButton('end', 'End')}
      </View>

      {resolvedError ? <Text style={styles.error}>{resolvedError}</Text> : null}

      {activeField ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={false}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={styles.doneButton}
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="Done selecting time"
            >
              <Text style={doneTextStyle}>Done</Text>
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

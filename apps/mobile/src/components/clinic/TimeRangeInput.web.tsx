import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { WebTimeField } from '@/components/clinic/WebDateTimeField.web';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatTimeRangePreview, isValidTimeRange } from '@/lib/time';
import { useThemedStyles, type GradientAccent } from '@/theme';

export type TimeRange = {
  startTime: string;
  endTime: string;
};

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
  const { isCompact } = useResponsiveLayout();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  useEffect(() => {
    onPickerOpenChange?.(startOpen || endOpen);
  }, [startOpen, endOpen, onPickerOpenChange]);

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

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.sm },
    row: {
      flexDirection: isCompact ? ('column' as const) : ('row' as const),
      alignItems: isCompact ? ('stretch' as const) : ('flex-start' as const),
      gap: spacing.sm,
    },
    rowLabel: {
      width: isCompact ? undefined : 36,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
      marginTop: isCompact ? 0 : 28,
    },
    field: { flex: 1 },
    dash: {
      fontSize: 14,
      color: colors.labelSecondary,
      alignSelf: 'center',
      marginTop: isCompact ? 0 : 28,
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

  const preview = formatTimeRangePreview(schedule.startTime, schedule.endTime);

  return (
    <View style={styles.wrap}>
      {!embedded && sectionLabel ? (
        <FormFieldLabel label={sectionLabel} required={required} />
      ) : null}
      <View style={styles.row}>
        {rowLabel ? <Text style={styles.rowLabel}>{rowLabel}</Text> : null}
        <View style={styles.field}>
          <WebTimeField
            label="Start"
            value={schedule.startTime}
            onChange={(startTime) => onChange({ ...schedule, startTime })}
            hint="Tap to select start time"
            onOpenChange={setStartOpen}
            accent={accent}
            invalid={rangeInvalid}
          />
        </View>
        {!isCompact ? <Text style={styles.dash}>–</Text> : null}
        <View style={styles.field}>
          <WebTimeField
            label="End"
            value={schedule.endTime}
            onChange={(endTime) => onChange({ ...schedule, endTime })}
            hint="Tap to select end time"
            onOpenChange={setEndOpen}
            accent={accent}
            invalid={rangeInvalid}
          />
        </View>
      </View>
      {resolvedError ? <Text style={styles.error}>{resolvedError}</Text> : null}
      {showPreview && preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Hours preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

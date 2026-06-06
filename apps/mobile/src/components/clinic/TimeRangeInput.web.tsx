import { Text, View } from 'react-native';

import { WebTimeField } from '@/components/clinic/WebDateTimeField.web';
import { formatTimeRangePreview } from '@/lib/time';
import { useThemedStyles } from '@/theme';

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
};

export function TimeRangeInput({
  sectionLabel,
  rowLabel,
  schedule,
  onChange,
  showPreview = false,
}: TimeRangeInputProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.sm },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    rowLabel: {
      width: 36,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
      marginTop: 28,
    },
    field: { flex: 1 },
    dash: {
      fontSize: 14,
      color: colors.labelSecondary,
      marginTop: 28,
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

  return (
    <View style={styles.wrap}>
      {sectionLabel ? <Text style={styles.sectionLabel}>{sectionLabel}</Text> : null}
      <View style={styles.row}>
        {rowLabel ? <Text style={styles.rowLabel}>{rowLabel}</Text> : null}
        <View style={styles.field}>
          <WebTimeField
            label="Start"
            value={schedule.startTime}
            onChange={(startTime) => onChange({ ...schedule, startTime })}
            hint="Tap to select start time"
          />
        </View>
        <Text style={styles.dash}>–</Text>
        <View style={styles.field}>
          <WebTimeField
            label="End"
            value={schedule.endTime}
            onChange={(endTime) => onChange({ ...schedule, endTime })}
            hint="Tap to select end time"
          />
        </View>
      </View>
      {showPreview && preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Hours preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

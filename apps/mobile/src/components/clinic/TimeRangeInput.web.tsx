import { Text, View } from 'react-native';

import { WebTimeField } from '@/components/clinic/WebDateTimeField.web';
import {
  formatTime12h,
  formatTimeRangePreview,
} from '@/lib/time';
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
    fields: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    field: { flex: 1 },
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
    selectedHint: {
      fontSize: 13,
      color: colors.labelSecondary,
    },
  }));

  const preview = formatTimeRangePreview(schedule.startTime, schedule.endTime);

  return (
    <View style={styles.wrap}>
      {sectionLabel ? <Text style={styles.sectionLabel}>{sectionLabel}</Text> : null}
      <View style={styles.row}>
        {rowLabel ? <Text style={styles.rowLabel}>{rowLabel}</Text> : null}
        <View style={styles.fields}>
          <View style={styles.field}>
            <WebTimeField
              label="Start"
              value={schedule.startTime}
              onChange={(startTime) => onChange({ ...schedule, startTime })}
            />
            <Text style={styles.selectedHint}>{displayTime(schedule.startTime)}</Text>
          </View>
          <View style={styles.field}>
            <WebTimeField
              label="End"
              value={schedule.endTime}
              onChange={(endTime) => onChange({ ...schedule, endTime })}
            />
            <Text style={styles.selectedHint}>{displayTime(schedule.endTime)}</Text>
          </View>
        </View>
      </View>
      {showPreview && preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Schedule preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

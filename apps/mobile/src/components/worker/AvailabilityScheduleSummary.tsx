import type { AvailabilityBlock } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';
import { formatTime12h } from '@/lib/time';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type AvailabilityScheduleSummaryProps = {
  blocks: AvailabilityBlock[];
};

export function AvailabilityScheduleSummary({ blocks }: AvailabilityScheduleSummaryProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    day: { ...typography.body, fontWeight: '600' },
    time: typography.subtitle,
    empty: typography.subtitle,
  }));

  if (blocks.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>No weekly schedule set yet.</Text>
      </View>
    );
  }

  const enabledDays = DAY_OF_WEEK_OPTIONS.map((day) => {
    const block = blocks.find((item) => item.day_of_week === day.value);
    return { label: day.label, block };
  }).filter((item) => item.block);

  return (
    <View style={styles.card}>
      {enabledDays.map(({ label, block }) => (
        <View key={label} style={styles.row}>
          <Text style={styles.day}>{label}</Text>
          <Text style={styles.time}>
            {formatTime12h(block!.start_time.slice(0, 5)) ?? block!.start_time} –{' '}
            {formatTime12h(block!.end_time.slice(0, 5)) ?? block!.end_time}
          </Text>
        </View>
      ))}
    </View>
  );
}

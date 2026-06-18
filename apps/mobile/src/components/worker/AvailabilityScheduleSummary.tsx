import type { AvailabilityBlock } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';
import { formatTime12h } from '@/lib/time';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { Text, View, Pressable } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

type AvailabilityScheduleSummaryProps = {
  blocks: AvailabilityBlock[];
  variant?: 'card' | 'grouped';
};

export function AvailabilityScheduleSummary({
  blocks,
  variant = 'card',
}: AvailabilityScheduleSummaryProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    grouped: {
      gap: 0,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    groupedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 8,
      ...webPointer('default'),
    },
    groupedRowHovered: webListRowHoverStyles(colors),
    groupedEmpty: {
      paddingVertical: spacing.md,
    },
    day: { ...typography.body, fontWeight: '600' },
    time: typography.subtitle,
    empty: typography.subtitle,
  }));

  const wrapStyle = variant === 'grouped' ? styles.grouped : styles.card;

  if (blocks.length === 0) {
    return (
      <View style={[wrapStyle, variant === 'grouped' && styles.groupedEmpty]}>
        <Text style={styles.empty}>No available days set yet.</Text>
      </View>
    );
  }

  const enabledDays = DAY_OF_WEEK_OPTIONS.map((day) => {
    const block = blocks.find((item) => item.day_of_week === day.value);
    return { label: day.label, block };
  }).filter((item) => item.block);

  return (
    <View style={wrapStyle}>
      {enabledDays.map(({ label, block }, index) => (
        <View key={label}>
          {variant === 'grouped' && index > 0 ? <RowDivider /> : null}
          <Pressable
            style={({ pressed, hovered }) => [
              variant === 'grouped' ? styles.groupedRow : styles.row,
              variant === 'grouped' && webHover(hovered, pressed, styles.groupedRowHovered),
            ]}
          >
            <Text style={styles.day}>{label}</Text>
            <Text style={styles.time}>
              {formatTime12h(block!.start_time.slice(0, 5)) ?? block!.start_time} –{' '}
              {formatTime12h(block!.end_time.slice(0, 5)) ?? block!.end_time}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

import { View } from 'react-native';

import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

const WEEKDAY_COUNT = 7;
const DAY_CELL_COUNT = 35;

/** Calendar-shaped skeleton: month chrome + weekday row + day grid + agenda rows. */
export function CalendarSkeleton() {
  const { isTablet } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    wrap: {
      gap: spacing.lg,
      flexDirection: isTablet ? ('row' as const) : ('column' as const),
      alignItems: 'flex-start' as const,
    },
    calendarColumn: {
      flex: isTablet ? 1 : undefined,
      width: isTablet ? undefined : ('100%' as const),
      minWidth: 0,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    agendaColumn: {
      flex: isTablet ? 1 : undefined,
      width: isTablet ? undefined : ('100%' as const),
      minWidth: 0,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.xs,
    },
    weekdayRow: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center' as const,
    },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    dayCell: {
      width: '14.28%' as const,
      aspectRatio: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 2,
    },
  }));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading schedule">
      <View style={styles.calendarColumn}>
        <View style={styles.headerRow}>
          <ShimmerBlock height={28} width={28} borderRadius={14} />
          <ShimmerBlock height={16} width="42%" borderRadius={6} />
          <ShimmerBlock height={28} width={28} borderRadius={14} />
        </View>
        <View style={styles.weekdayRow}>
          {Array.from({ length: WEEKDAY_COUNT }, (_, index) => (
            <View key={index} style={styles.weekdayCell}>
              <ShimmerBlock height={10} width="70%" borderRadius={4} />
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: DAY_CELL_COUNT }, (_, index) => (
            <View key={index} style={styles.dayCell}>
              <ShimmerBlock height={28} width={28} borderRadius={14} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.agendaColumn}>
        <ShimmerBlock height={18} width="48%" borderRadius={6} />
        <ShimmerBlock height={72} width="100%" borderRadius={16} />
        <ShimmerBlock height={72} width="100%" borderRadius={16} />
        <ShimmerBlock height={72} width="100%" borderRadius={16} />
      </View>
    </View>
  );
}

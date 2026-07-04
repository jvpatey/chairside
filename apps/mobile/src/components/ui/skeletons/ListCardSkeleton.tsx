import { View } from 'react-native';

import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { useThemedStyles } from '@/theme';

type ListCardSkeletonProps = {
  rowCount?: number;
  rowHeight?: number;
  compact?: boolean;
};

/** Shimmer list rows matching browse/posting/application card height. */
export function ListCardSkeleton({
  rowCount = 4,
  rowHeight = 132,
  compact = false,
}: ListCardSkeletonProps) {
  const styles = useThemedStyles(({ spacing, colors, radii }) => ({
    container: {
      gap: spacing.md,
    },
    stackedCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    lines: {
      flex: 1,
      gap: spacing.sm,
      paddingTop: 2,
    },
  }));

  if (compact) {
    return (
      <View style={styles.stackedCard}>
        {Array.from({ length: rowCount }, (_, index) => (
          <View
            key={index}
            style={[styles.row, index === rowCount - 1 ? styles.rowLast : null]}>
            <ShimmerBlock height={40} width={40} borderRadius={20} />
            <View style={styles.lines}>
              <ShimmerBlock height={12} width="38%" borderRadius={6} />
              <ShimmerBlock height={16} width="72%" borderRadius={6} />
              <ShimmerBlock height={12} width="54%" borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: rowCount }, (_, index) => (
        <ShimmerBlock key={index} height={rowHeight} width="100%" borderRadius={16} />
      ))}
    </View>
  );
}

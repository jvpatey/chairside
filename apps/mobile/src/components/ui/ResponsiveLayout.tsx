import { Children, ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type ResponsiveColumnsProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Stacks children on phone; places them side-by-side on tablet regular+ widths. */
export function ResponsiveColumns({ children, style }: ResponsiveColumnsProps) {
  const { isTablet } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.lg,
      alignItems: 'flex-start',
    },
    column: {
      flex: 1,
      minWidth: 0,
    },
  }));

  const items = Children.toArray(children);

  if (!isTablet) {
    return <View style={style}>{items}</View>;
  }

  return (
    <View style={[styles.row, style]}>
      {items.map((child, index) => (
        <View key={index} style={styles.column}>
          {child}
        </View>
      ))}
    </View>
  );
}

type ResponsiveGridProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Single column on phone; two-column wrapped grid on wide tablet widths. */
export function ResponsiveGrid({ children, style }: ResponsiveGridProps) {
  const { gridColumns, isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      flexDirection: isWide ? 'row' : 'column',
      flexWrap: isWide ? 'wrap' : 'nowrap',
      gap: spacing.md,
    },
    item: {
      width: gridColumns === 2 ? '48%' : '100%',
    },
  }));

  const items = Children.toArray(children);

  return (
    <View style={[styles.grid, style]}>
      {items.map((child, index) => (
        <View key={index} style={styles.item}>
          {child}
        </View>
      ))}
    </View>
  );
}

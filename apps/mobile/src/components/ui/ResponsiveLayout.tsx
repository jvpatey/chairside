import { Children, ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type ResponsiveColumnsProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When to switch to side-by-side. Default tablet (≥768); use `wide` for ≥1024. */
  breakpoint?: 'tablet' | 'wide';
};

/** Stacks children on narrow widths; places them side-by-side above the breakpoint. */
export function ResponsiveColumns({
  children,
  style,
  breakpoint = 'tablet',
}: ResponsiveColumnsProps) {
  const { isTablet, isWide } = useResponsiveLayout();
  const useRow = breakpoint === 'wide' ? isWide : isTablet;
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

  if (!useRow) {
    return <View style={[{ flexDirection: 'column' }, style]}>{items}</View>;
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

/** Single column on phone; 2-col at wide / 3-col at xwide via `gridColumns`. */
export function ResponsiveGrid({ children, style }: ResponsiveGridProps) {
  const { gridColumns, isWide } = useResponsiveLayout();
  const columns = isWide ? gridColumns : 1;
  const itemWidth =
    columns === 3 ? ('31.5%' as const) : columns === 2 ? ('48%' as const) : ('100%' as const);

  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      flexDirection: columns > 1 ? ('row' as const) : ('column' as const),
      flexWrap: columns > 1 ? ('wrap' as const) : ('nowrap' as const),
      gap: spacing.md,
    },
    item: {
      width: itemWidth,
      // Keep cards from stretching oddly when the last row is short
      maxWidth: columns > 1 ? itemWidth : undefined,
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

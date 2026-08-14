import { Children, ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ResponsiveColumnsProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When to switch to side-by-side. Default tablet (≥768); use `wide` for ≥1024. */
  breakpoint?: 'tablet' | 'wide';
  /** Stretch columns to equal height (desktop master/detail style panes). */
  stretch?: boolean;
};

/** Stacks children on narrow widths; places them side-by-side above the breakpoint. */
export function ResponsiveColumns({
  children,
  style,
  breakpoint = 'tablet',
  stretch = false,
}: ResponsiveColumnsProps) {
  const { isTablet, isWide } = useResponsiveLayout();
  const useRow = breakpoint === 'wide' ? isWide : isTablet;
  const useWebEqualHeight = stretch && Platform.OS === 'web';
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
      alignItems: stretch ? ('stretch' as const) : ('flex-start' as const),
      // CSS grid gives reliable equal-height columns inside ScrollViews on web.
      ...(useWebEqualHeight
        ? webOnlyStyle({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'stretch',
          } as ViewStyle)
        : null),
    },
    column: {
      flex: 1,
      minWidth: 0,
      ...(stretch
        ? {
            alignSelf: 'stretch' as const,
            ...webOnlyStyle({
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '100%',
            } as ViewStyle),
          }
        : null),
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
  /** Cap columns (e.g. roles list stays 2-up on x-wide web). Default uses layout `gridColumns`. */
  maxColumns?: 1 | 2 | 3;
};

/** Single column on phone; 2-col at wide / 3-col at xwide via `gridColumns`. */
export function ResponsiveGrid({ children, style, maxColumns }: ResponsiveGridProps) {
  const { gridColumns, isWide } = useResponsiveLayout();
  const layoutColumns = isWide ? gridColumns : 1;
  const columns = maxColumns != null ? Math.min(layoutColumns, maxColumns) : layoutColumns;
  const itemWidth =
    columns === 3 ? ('31.5%' as const) : columns === 2 ? ('48%' as const) : ('100%' as const);
  const useWebGrid = Platform.OS === 'web' && columns > 1;

  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      gap: spacing.md,
      ...(useWebGrid
        ? webOnlyStyle({
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            alignItems: 'stretch',
          } as ViewStyle)
        : {
            flexDirection: columns > 1 ? ('row' as const) : ('column' as const),
            flexWrap: columns > 1 ? ('wrap' as const) : ('nowrap' as const),
          }),
    },
    item: {
      ...(useWebGrid
        ? webOnlyStyle({
            minWidth: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          } as ViewStyle)
        : {
            width: itemWidth,
            // Keep cards from stretching oddly when the last row is short
            maxWidth: columns > 1 ? itemWidth : undefined,
          }),
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

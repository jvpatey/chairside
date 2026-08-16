import { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

const DEFAULT_MASTER_WIDTH = 340;

type MasterDetailLayoutProps = {
  master: ReactNode;
  detail?: ReactNode;
  context?: ReactNode;
  showDetail?: boolean;
  masterWidth?: number;
  style?: StyleProp<ViewStyle>;
  contextCollapsed?: boolean;
  onContextCollapsedChange?: (collapsed: boolean) => void;
  /** Card-style panes with rounded corners — for workspace split views like Applications. */
  roundedPanes?: boolean;
};

/**
 * Renders a single column on phone. On tablet regular+ widths, shows a fixed-width
 * master pane beside an optional detail pane — intended for list/detail screens
 * identified in `ipadListDetailCandidates`.
 */
export function MasterDetailLayout({
  master,
  detail,
  showDetail = Boolean(detail),
  masterWidth = DEFAULT_MASTER_WIDTH,
  style,
  roundedPanes = false,
}: MasterDetailLayoutProps) {
  const { isTablet } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, radii, elevation }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.backgroundGrouped,
    },
    row: {
      flex: 1,
      flexDirection: 'row' as const,
      minHeight: 0,
    },
    rowRounded: {
      gap: spacing.md,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    master: {
      width: masterWidth,
      flexShrink: 0,
      flexDirection: 'column' as const,
      minHeight: 0,
      overflow: 'hidden' as const,
      ...(roundedPanes
        ? null
        : {
            borderRightWidth: 0.5,
            borderRightColor: colors.separator,
            backgroundColor: colors.backgroundGrouped,
          }),
    },
    detail: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      flexDirection: 'column' as const,
      overflow: 'hidden' as const,
      ...(roundedPanes ? null : { backgroundColor: colors.background }),
    },
    roundedShell: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...elevation('subtle'),
    },
    roundedDetailShell: {
      backgroundColor: colors.background,
    },
    paneContent: {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
    },
  }));

  if (!isTablet || !showDetail) {
    return <View style={[styles.root, style]}>{master}</View>;
  }

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.row, roundedPanes ? styles.rowRounded : null]}>
        <View style={[styles.master, roundedPanes ? styles.roundedShell : null]}>
          <View style={styles.paneContent}>{master}</View>
        </View>
        <View
          style={[
            styles.detail,
            roundedPanes ? styles.roundedShell : null,
            roundedPanes ? styles.roundedDetailShell : null,
          ]}>
          <View style={styles.paneContent}>{detail}</View>
        </View>
      </View>
    </View>
  );
}

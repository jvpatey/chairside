import { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

const DEFAULT_MASTER_WIDTH = 340;

type MasterDetailLayoutProps = {
  master: ReactNode;
  detail?: ReactNode;
  /** When false on tablet, only the master pane is shown (e.g. no selection yet). */
  showDetail?: boolean;
  masterWidth?: number;
  style?: StyleProp<ViewStyle>;
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
}: MasterDetailLayoutProps) {
  const { isTablet } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors }) => ({
    row: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 0,
    },
    master: {
      width: masterWidth,
      flexShrink: 0,
      borderRightWidth: 0.5,
      borderRightColor: colors.separator,
    },
    detail: {
      flex: 1,
      minWidth: 0,
    },
  }));

  if (!isTablet || !showDetail) {
    return <View style={[{ flex: 1, minHeight: 0 }, style]}>{master}</View>;
  }

  return (
    <View style={[styles.row, style]}>
      <View style={styles.master}>{master}</View>
      <View style={styles.detail}>{detail}</View>
    </View>
  );
}

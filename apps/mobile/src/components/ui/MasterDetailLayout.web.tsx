import { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

const DEFAULT_MASTER_WIDTH = 340;
const CONTEXT_WIDTH = 320;

type MasterDetailLayoutProps = {
  master: ReactNode;
  detail?: ReactNode;
  context?: ReactNode;
  showDetail?: boolean;
  masterWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Web master/detail with optional third context pane at xwide widths. */
export function MasterDetailLayout({
  master,
  detail,
  context,
  showDetail = Boolean(detail),
  masterWidth = DEFAULT_MASTER_WIDTH,
  style,
}: MasterDetailLayoutProps) {
  const { isTablet, isXWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, isDark }) => ({
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
    master: {
      width: masterWidth,
      flexShrink: 0,
      borderRightWidth: 0.5,
      borderRightColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    detail: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.background,
    },
    context: {
      width: CONTEXT_WIDTH,
      flexShrink: 0,
      borderLeftWidth: 0.5,
      borderLeftColor: colors.separator,
      backgroundColor: colors.surface,
      // @ts-expect-error web shadow
      boxShadow: getWebShadow(isDark, 'subtle'),
    },
  }));

  if (!isTablet || !showDetail) {
    return <View style={[styles.root, style]}>{master}</View>;
  }

  return (
    <View style={[styles.root, style]}>
      <View style={styles.row}>
        <View style={styles.master}>{master}</View>
        <View style={styles.detail}>{detail}</View>
        {isXWide && context ? <View style={styles.context}>{context}</View> : null}
      </View>
    </View>
  );
}

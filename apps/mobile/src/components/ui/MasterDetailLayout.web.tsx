import { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

const DEFAULT_MASTER_WIDTH = 380;
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
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const showAtmosphere = tabAtmosphere !== 'none';
  const atmosphereLayer = showAtmosphere ? (
    <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
  ) : null;
  const styles = useThemedStyles(({ colors, isDark }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: showAtmosphere ? 'transparent' : colors.backgroundGrouped,
    },
    row: {
      flex: 1,
      flexDirection: 'row' as const,
      minHeight: 0,
    },
    pane: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      flexDirection: 'column' as const,
    },
    master: {
      width: masterWidth,
      flexShrink: 0,
      borderRightWidth: 0.5,
      borderRightColor: colors.separator,
      backgroundColor: showAtmosphere ? 'transparent' : colors.backgroundGrouped,
    },
    detail: {
      flex: 1,
      minWidth: 0,
      backgroundColor: showAtmosphere ? 'transparent' : colors.background,
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
      <View style={styles.row}>
        <View style={[styles.master, styles.pane]}>
          {atmosphereLayer}
          <View style={styles.paneContent}>{master}</View>
        </View>
        <View style={[styles.detail, styles.pane]}>
          {atmosphereLayer}
          <View style={styles.paneContent}>{detail}</View>
        </View>
        {isXWide && context ? <View style={styles.context}>{context}</View> : null}
      </View>
    </View>
  );
}

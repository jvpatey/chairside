import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { useShellAtmosphere, useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webMotion, webTransition } from '@/theme/web';

const DEFAULT_MASTER_WIDTH = 380;
const CONTEXT_WIDTH = 320;
const CONTEXT_RAIL_WIDTH = 44;

const PANE_TRANSITION = webOnlyStyle({
  transitionProperty: 'width, flex, flex-grow, flex-basis, max-width, opacity',
  transitionDuration: webMotion.normal,
  transitionTimingFunction: webMotion.easingOut,
} as ViewStyle);

type MasterDetailLayoutProps = {
  master: ReactNode;
  detail?: ReactNode;
  context?: ReactNode;
  showDetail?: boolean;
  masterWidth?: number;
  style?: StyleProp<ViewStyle>;
  contextCollapsed?: boolean;
  onContextCollapsedChange?: (collapsed: boolean) => void;
};

/** Web master/detail with optional third context pane at xwide widths. */
export function MasterDetailLayout({
  master,
  detail,
  context,
  showDetail = Boolean(detail),
  masterWidth = DEFAULT_MASTER_WIDTH,
  style,
  contextCollapsed = false,
  onContextCollapsedChange,
}: MasterDetailLayoutProps) {
  const { colors } = useTheme();
  const { isTablet, isXWide } = useResponsiveLayout();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const showAtmosphere = tabAtmosphere !== 'none' && !shellAtmosphere;
  const passThroughAtmosphere = showAtmosphere || shellAtmosphere;
  const atmosphereLayer = showAtmosphere ? (
    <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
  ) : null;
  const showContext = Boolean(context) && isXWide;
  const contextCollapsible = showContext && Boolean(onContextCollapsedChange);
  const contextExpanded = !contextCollapsed || !contextCollapsible;
  const contextPaneWidth = contextExpanded ? CONTEXT_WIDTH : CONTEXT_RAIL_WIDTH;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
    },
    row: {
      flex: 1,
      flexDirection: 'row' as const,
      minHeight: 0,
      width: '100%',
    },
    pane: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      flexDirection: 'column' as const,
      minHeight: 0,
    },
    masterFixed: {
      width: masterWidth,
      flexShrink: 0,
      flexGrow: 0,
      borderRightWidth: 0.5,
      borderRightColor: colors.separator,
      backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
    },
    masterExpanded: {
      flex: 1,
      flexShrink: 1,
      flexGrow: 1,
      minWidth: masterWidth,
      maxWidth: '42%',
      borderRightWidth: 0.5,
      borderRightColor: colors.separator,
      backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
    },
    detailBase: {
      minWidth: 0,
      backgroundColor: passThroughAtmosphere ? 'transparent' : colors.background,
    },
    detailExpanded: {
      flex: 1.45,
      flexShrink: 1,
      flexGrow: 1.45,
    },
    detailCompact: {
      flex: 1,
      flexShrink: 1,
      flexGrow: 1,
    },
    contextPane: {
      flexShrink: 0,
      borderLeftWidth: 0.5,
      borderLeftColor: colors.separator,
      backgroundColor: passThroughAtmosphere ? 'transparent' : colors.surface,
      boxShadow: getWebShadow(isDark, 'subtle') as ViewStyle['boxShadow'],
    },
    contextInner: {
      width: CONTEXT_WIDTH,
      flex: 1,
      minHeight: 0,
    },
    contextRail: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      paddingTop: spacing.md,
    },
    contextRailButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    contextRailButtonPressed: {
      opacity: 0.8,
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
        <View
          style={[
            styles.pane,
            contextExpanded ? styles.masterFixed : styles.masterExpanded,
            PANE_TRANSITION,
          ]}
        >
          {atmosphereLayer}
          <View style={styles.paneContent}>{master}</View>
        </View>

        <View
          style={[
            styles.pane,
            styles.detailBase,
            contextExpanded ? styles.detailCompact : styles.detailExpanded,
            PANE_TRANSITION,
          ]}
        >
          {atmosphereLayer}
          <View style={styles.paneContent}>{detail}</View>
        </View>

        {showContext ? (
          <View
            style={[
              styles.pane,
              styles.contextPane,
              { width: contextPaneWidth },
              PANE_TRANSITION,
            ]}
          >
            {atmosphereLayer}
            <View
              style={[
                styles.contextInner,
                {
                  opacity: contextExpanded ? 1 : 0,
                  pointerEvents: contextExpanded ? ('auto' as const) : ('none' as const),
                },
                webTransition(['opacity']),
              ]}
            >
              <View style={styles.paneContent}>{context}</View>
            </View>
            {contextCollapsible && !contextExpanded ? (
              <View style={styles.contextRail} pointerEvents="box-none">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show applicant details"
                  onPress={() => onContextCollapsedChange?.(false)}
                  style={({ pressed }) => [
                    styles.contextRailButton,
                    pressed && styles.contextRailButtonPressed,
                  ]}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.labelSecondary} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

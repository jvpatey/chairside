import { Platform } from 'react-native';

import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTheme } from '@/theme';

export function useAdaptiveTabScreenOptions() {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const { sidebarWidth } = useSidebarCollapse();

  const shared = {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabInactive,
    headerShown: false,
    // Opaque scenes prevent inactive tab screens from stacking on web.
    sceneStyle: {
      backgroundColor: colors.backgroundGrouped,
    },
    sceneContainerStyle: {
      backgroundColor: colors.backgroundGrouped,
    },
    ...(Platform.OS === 'web' ? { detachInactiveScreens: true } : {}),
  };

  if (isTablet) {
    const isWebTablet = Platform.OS === 'web';
    return {
      ...shared,
      sceneStyle: { backgroundColor: 'transparent' },
      sceneContainerStyle: { backgroundColor: 'transparent' },
      tabBarPosition: 'left' as const,
      safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
      tabBarStyle: {
        width: sidebarWidth,
        maxWidth: sidebarWidth,
        flexGrow: 0,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: 'transparent',
        borderRightWidth: isWebTablet ? 0 : Platform.OS === 'ios' ? 0.5 : 1,
        borderRightColor: isWebTablet ? 'transparent' : colors.separator,
        paddingTop: 0,
        paddingBottom: 0,
        ...(isWebTablet
          ? {
              elevation: 0,
              shadowOpacity: 0,
              transitionProperty: 'width, max-width',
              transitionDuration: '220ms',
              transitionTimingFunction: 'ease-out',
            }
          : {}),
      },
    };
  }

  return {
    ...shared,
    tabBarStyle: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarShowLabel: false,
    tabBarBackground: () => null,
  };
}

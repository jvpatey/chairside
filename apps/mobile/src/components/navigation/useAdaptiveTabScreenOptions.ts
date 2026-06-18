import { Platform } from 'react-native';

import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTheme } from '@/theme';

export function useAdaptiveTabScreenOptions() {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const { sidebarWidth } = useSidebarCollapse();

  const isWeb = Platform.OS === 'web';

  const shared = {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabInactive,
    headerShown: false,
    // Web tab scenes stay opaque so inactive screens do not stack underneath.
    // Native scenes are transparent so TabAtmosphereShell's gradient shows through.
    sceneStyle: {
      backgroundColor: isWeb ? colors.backgroundGrouped : 'transparent',
    },
    sceneContainerStyle: {
      backgroundColor: isWeb ? colors.backgroundGrouped : 'transparent',
    },
    ...(isWeb ? { detachInactiveScreens: true } : {}),
  };

  if (isTablet) {
    const isWebTablet = Platform.OS === 'web';
    return {
      ...shared,
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

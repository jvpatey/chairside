import { Platform, type ViewStyle } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { useShellAtmosphere, useTabAtmosphere } from '@/contexts/TabAtmosphereContext';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme } from '@/theme';

type TabScreenOptionsArgs = {
  navigation: { isFocused: () => boolean };
};

/** Hide inactive tab scenes on web — react-native-screens does not detach them. */
function webInactiveSceneStyle(isFocused: boolean): ViewStyle {
  if (Platform.OS !== 'web' || isFocused) return {};
  return webOnlyStyle({ display: 'none' }) as ViewStyle;
}

export function useAdaptiveTabScreenOptions(): (
  args: TabScreenOptionsArgs,
) => BottomTabNavigationOptions {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const { sidebarWidth } = useSidebarCollapse();
  const tabAtmosphere = useTabAtmosphere();
  const shellAtmosphere = useShellAtmosphere();

  const isWeb = Platform.OS === 'web';
  const isWebTablet = isWeb && isTablet;
  const transparentScenes =
    !isWeb || shellAtmosphere || (isWebTablet && tabAtmosphere !== 'none');

  return ({ navigation }) => {
    const isFocused = navigation.isFocused();
    const sceneBackground = transparentScenes ? 'transparent' : colors.backgroundGrouped;

    const shared: BottomTabNavigationOptions = {
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
      headerShown: false,
      sceneStyle: {
        backgroundColor: sceneBackground,
        ...webInactiveSceneStyle(isFocused),
      },
      ...(isWeb ? { detachInactiveScreens: true, lazy: true } : {}),
    };

    if (isTablet) {
      const isWebTabletLayout = Platform.OS === 'web';
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
          borderRightWidth: isWebTabletLayout ? 0 : Platform.OS === 'ios' ? 0.5 : 1,
          borderRightColor: isWebTabletLayout ? 'transparent' : colors.separator,
          paddingTop: 0,
          paddingBottom: 0,
          ...(isWebTabletLayout
            ? {
                elevation: 0,
                shadowOpacity: 0,
                transitionProperty: 'width, max-width',
                transitionDuration: '220ms',
                transitionTimingFunction: 'ease-out',
              }
            : {}),
        },
        // Prevent RN bottom-tabs default `colors.card` fill if the stock bar ever mounts.
        tabBarBackground: () => null,
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
  };
}

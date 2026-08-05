import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, View, type ViewStyle } from 'react-native';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { MobileTabDock } from '@/components/navigation/MobileTabDock';
import { TabletSidebar } from '@/components/navigation/TabletSidebar';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import {
  useShellAtmosphere,
  useTabAtmosphere,
  useTabAtmosphereAccent,
} from '@/contexts/TabAtmosphereContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';

type AdaptiveTabBarProps = BottomTabBarProps & {
  role: 'worker' | 'clinic';
};

function AdaptiveTabBar({ role, ...props }: AdaptiveTabBarProps) {
  const { isTablet } = useResponsiveLayout();
  const { sidebarWidth } = useSidebarCollapse();
  const shellAtmosphere = useShellAtmosphere();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  // Paint the same viewport-fixed wash inside the sidebar column so gaps around
  // the floating glass aren't left on a flat navigator/theme surface.
  const showSidebarAtmosphere =
    shellAtmosphere && Platform.OS === 'web' && tabAtmosphere !== 'none';

  if (isTablet) {
    return (
      <View
        style={{
          width: sidebarWidth,
          maxWidth: sidebarWidth,
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: 'stretch',
          backgroundColor: 'transparent',
          ...(Platform.OS === 'web'
            ? ({
                height: '100%',
                // visible so glass shadow isn't clipped; atmosphere is fixed anyway
                overflow: 'visible',
                position: 'relative',
                ...webOnlyStyle({
                  transitionProperty: 'width, max-width',
                  transitionDuration: '220ms',
                  transitionTimingFunction: 'ease-out',
                } as ViewStyle),
              } as ViewStyle)
            : {}),
        }}>
        {showSidebarAtmosphere ? (
          <AppAtmosphere
            intensity={tabAtmosphere}
            accent={tabAtmosphereAccent}
            viewportFixed
          />
        ) : null}
        <TabletSidebar {...props} role={role} />
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
      }}>
      <MobileTabDock {...props} role={role} />
    </View>
  );
}

/** Render-prop wrapper — React Navigation calls tabBar as a function, not a component. */
export function renderWorkerTabBar(props: BottomTabBarProps) {
  return <AdaptiveTabBar {...props} role="worker" />;
}

export function renderClinicTabBar(props: BottomTabBarProps) {
  return <AdaptiveTabBar {...props} role="clinic" />;
}

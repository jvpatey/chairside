import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, View, type ViewStyle } from 'react-native';

import { TabletSidebar } from '@/components/navigation/TabletSidebar';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme } from '@/theme';

type AdaptiveTabBarProps = BottomTabBarProps & {
  role: 'worker' | 'clinic';
};

function AdaptiveTabBar({ role, ...props }: AdaptiveTabBarProps) {
  const { isTablet } = useResponsiveLayout();
  const { colors } = useTheme();
  const { sidebarWidth } = useSidebarCollapse();

  if (isTablet) {
    return (
      <View
        style={{
          width: sidebarWidth,
          maxWidth: sidebarWidth,
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: 'stretch',
          backgroundColor: colors.surface,
          ...(Platform.OS === 'web'
            ? ({
                height: '100%',
                overflow: 'visible',
                ...webOnlyStyle({
                  transitionProperty: 'width, max-width',
                  transitionDuration: '220ms',
                  transitionTimingFunction: 'ease-out',
                } as ViewStyle),
              } as ViewStyle)
            : {}),
        }}>
        <TabletSidebar {...props} role={role} />
      </View>
    );
  }

  return <BottomTabBar {...props} />;
}

/** Render-prop wrapper — React Navigation calls tabBar as a function, not a component. */
export function renderWorkerTabBar(props: BottomTabBarProps) {
  return <AdaptiveTabBar {...props} role="worker" />;
}

export function renderClinicTabBar(props: BottomTabBarProps) {
  return <AdaptiveTabBar {...props} role="clinic" />;
}

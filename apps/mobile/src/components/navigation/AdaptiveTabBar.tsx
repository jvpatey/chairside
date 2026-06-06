import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { TABLET_SIDEBAR_WIDTH, TabletSidebar } from '@/components/navigation/TabletSidebar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTheme } from '@/theme';

type AdaptiveTabBarProps = BottomTabBarProps & {
  role: 'worker' | 'clinic';
};

function AdaptiveTabBar({ role, ...props }: AdaptiveTabBarProps) {
  const { isTablet } = useResponsiveLayout();
  const { colors } = useTheme();

  if (isTablet) {
    return (
      <View
        style={{
          width: TABLET_SIDEBAR_WIDTH,
          maxWidth: TABLET_SIDEBAR_WIDTH,
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: 'stretch',
          backgroundColor: colors.surface,
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

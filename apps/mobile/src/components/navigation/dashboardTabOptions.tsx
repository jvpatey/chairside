import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import {
  DashboardTabBarButton,
  DashboardTabIcon,
} from '@/components/navigation/DashboardTabBarButton';

type DashboardTabButtonProps = ComponentProps<typeof DashboardTabBarButton>;

export function getDashboardTabOptions(isTablet: boolean) {
  if (isTablet) {
    return {
      title: 'Dashboard',
      tabBarAccessibilityLabel: 'Dashboard',
      tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
      ),
    };
  }

  return {
    title: 'Dashboard',
    tabBarAccessibilityLabel: 'Dashboard',
    tabBarLabel: () => null,
    tabBarItemStyle: { paddingVertical: 6 },
    tabBarButton: (props: DashboardTabButtonProps) => <DashboardTabBarButton {...props} />,
    tabBarIcon: ({ focused }: { focused: boolean }) => <DashboardTabIcon focused={focused} />,
  };
}

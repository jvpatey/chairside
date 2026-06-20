import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useGlobalSearchParams, usePathname } from 'expo-router';

import { getActiveTabBarName } from '@/lib/tabAtmosphereRoutes';

type TabBarRole = 'worker' | 'clinic';

type VisibleRoute = BottomTabBarProps['state']['routes'][number];

export function useResolvedTabBarFocus(
  state: BottomTabBarProps['state'],
  visibleRoutes: VisibleRoute[],
  role: TabBarRole,
) {
  const pathname = usePathname();
  const { returnTo } = useGlobalSearchParams<{ returnTo?: string }>();
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;

  const focusedVisibleIndex = visibleRoutes.findIndex(
    (route) => state.routes.findIndex((item) => item.key === route.key) === state.index,
  );

  const activeTabName =
    focusedVisibleIndex >= 0
      ? visibleRoutes[focusedVisibleIndex].name
      : getActiveTabBarName(pathname, role, resolvedReturnTo);

  const resolvedFocusedVisibleIndex = activeTabName
    ? visibleRoutes.findIndex((route) => route.name === activeTabName)
    : focusedVisibleIndex;

  const indicatorIndex = resolvedFocusedVisibleIndex >= 0 ? resolvedFocusedVisibleIndex : 0;

  return {
    activeTabName,
    indicatorIndex,
    isRouteFocused: (routeName: string, routeIndex: number) =>
      activeTabName ? routeName === activeTabName : state.index === routeIndex,
  };
}

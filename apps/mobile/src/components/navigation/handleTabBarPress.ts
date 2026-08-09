import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { router } from 'expo-router';

import { getTabRootHref } from '@/lib/routing';
import { isTabRootPath, type TabAtmosphereRole } from '@/lib/tabAtmosphereRoutes';

type HandleTabBarPressOptions = {
  route: { key: string; name: string };
  navigation: BottomTabBarProps['navigation'];
  state: BottomTabBarProps['state'];
  isFocused: boolean;
  pathname: string;
  role: TabAtmosphereRole;
};

/** Navigate to a tab's root screen when switching tabs or re-tapping an active tab from a nested route. */
export function handleTabBarPress({
  route,
  navigation,
  state,
  isFocused,
  pathname,
  role,
}: HandleTabBarPressOptions): void {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });

  if (event.defaultPrevented) {
    return;
  }

  const tabRootHref = getTabRootHref(route.name, role);

  // Re-tap focused tab: pop nested stack back to that tab's root.
  if (isFocused) {
    if (tabRootHref && !isTabRootPath(pathname, route.name, role)) {
      router.replace(tabRootHref);
    }
    return;
  }

  // Switching tabs: use navigate so sibling tab state stays mounted.
  // router.replace here remounts the navigator destination and can snap to the
  // first declared tab (Roles) after a web remount.
  navigation.dispatch({
    ...CommonActions.navigate(route.name),
    target: state.key,
  });
}

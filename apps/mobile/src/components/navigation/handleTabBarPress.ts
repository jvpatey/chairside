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

  if (tabRootHref) {
    const shouldResetToRoot = !isFocused || !isTabRootPath(pathname, route.name, role);
    if (shouldResetToRoot) {
      router.replace(tabRootHref);
      return;
    }
    return;
  }

  if (!isFocused) {
    navigation.dispatch({
      ...CommonActions.navigate(route.name),
      target: state.key,
    });
  }
}

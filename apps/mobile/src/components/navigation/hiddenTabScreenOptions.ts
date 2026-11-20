import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

/**
 * Options for Tabs.Screen routes that must render as scenes but have no tab-bar item
 * (detail/stack-style routes such as `shift/[id]` or `fill-in-availability`).
 *
 * Do NOT use `href: null` for these. In Expo Router 58, `href: null` maps to
 * `hidden: true`, and hidden routes are filtered out of the rendered tab scenes; if one
 * is focused the navigator redirects back to the initial tab (Home). The URL changes
 * but Home stays on screen. Our custom tab bars only list routes that define a
 * `tabBarIcon`, so omitting the icon is what keeps these out of the dock/sidebar.
 */
export const hiddenTabScreenOptions: BottomTabNavigationOptions = {
  tabBarItemStyle: { display: 'none' },
};

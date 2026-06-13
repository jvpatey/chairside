import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing } from '@/theme';

/** Fallback before the tab dock reports its layout height. Matches MobileTabDock chrome. */
export function getMobileTabDockMinimumInset(bottomSafeArea: number): number {
  return spacing.sm + spacing.xs * 2 + 52 + Math.max(bottomSafeArea, spacing.sm);
}

/** @deprecated Prefer `useMobileTabDockInset()`. Kept for static fallbacks. */
export const MOBILE_TAB_DOCK_SCROLL_INSET = getMobileTabDockMinimumInset(34);

type UseMobileTabDockInsetOptions = {
  /** When false, returns 0 (e.g. tablet split-view panes). */
  enabled?: boolean;
};

/** Bottom inset for content that must clear the floating phone tab dock. */
export function useMobileTabDockInset(options: UseMobileTabDockInsetOptions = {}): number {
  const { enabled = true } = options;
  const { isTablet } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext);

  if (!enabled || isTablet) return 0;
  // Outside a tab navigator the context is unset; do not reserve dock space.
  if (tabBarHeight == null) return 0;

  const minimum = getMobileTabDockMinimumInset(insets.bottom);
  if (tabBarHeight <= 0) return minimum;
  return Math.max(tabBarHeight, minimum);
}

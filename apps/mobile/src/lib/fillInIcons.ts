import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/** Canonical fill-in icon — short-notice shift coverage (tabs, dashboard, badges). */
export const FILL_IN_ICON = {
  outline: 'timer-outline',
  filled: 'timer',
} as const satisfies Record<'outline' | 'filled', keyof typeof Ionicons.glyphMap>;

export type FillInIconName = (typeof FILL_IN_ICON)[keyof typeof FILL_IN_ICON];

/** Tab bar, sidebar, and mobile dock icon for fill-in routes. */
export function fillInTabIcon(focused: boolean): FillInIconName {
  return focused ? FILL_IN_ICON.filled : FILL_IN_ICON.outline;
}

export function isFillInIcon(name: string): name is FillInIconName {
  return name === FILL_IN_ICON.outline || name === FILL_IN_ICON.filled;
}

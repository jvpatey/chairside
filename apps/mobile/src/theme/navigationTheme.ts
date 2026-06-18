import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import type { ColorSchemeName } from 'react-native';

import { getColors } from './colors';

/** Align React Navigation surfaces with app tokens so navigator gaps match screens. */
export function getAppNavigationTheme(scheme: ColorSchemeName | null | undefined): NavigationTheme {
  const colors = getColors(scheme);
  const isDark = scheme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.backgroundGrouped,
      card: colors.backgroundGrouped,
      text: colors.labelPrimary,
      border: colors.separator,
    },
  };
}

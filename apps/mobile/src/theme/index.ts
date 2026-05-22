import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { Colors, getColors, lightColors } from './colors';

export { Colors, darkColors, getColors, lightColors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type Typography = {
  title: {
    fontSize: number;
    fontWeight: '700';
    color: string;
  };
  subtitle: {
    fontSize: number;
    fontWeight: '400';
    color: string;
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: '400';
    color: string;
    lineHeight: number;
  };
};

export function createTypography(colors: Colors): Typography {
  return {
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.labelSecondary,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.labelPrimary,
      lineHeight: 24,
    },
  };
}

export type Theme = {
  colors: Colors;
  spacing: typeof spacing;
  typography: Typography;
  isDark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();

  return useMemo(() => {
    const colors = getColors(scheme);

    return {
      colors,
      spacing,
      typography: createTypography(colors),
      isDark: scheme === 'dark',
    };
  }, [scheme]);
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();

  // factory is defined inline at each call site; theme is the only reactive input
  // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}

/** @deprecated Use `useTheme().colors` for light/dark support. */
export const colors = lightColors;

/** @deprecated Use `useTheme().typography` for light/dark support. */
export const typography = createTypography(lightColors);

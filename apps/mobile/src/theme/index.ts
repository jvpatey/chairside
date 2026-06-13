import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { Colors, getColors, lightColors } from './colors';
import { fontBold, fontRegular, fontSemibold } from './fonts';
import { radii, getElevationStyle, type ElevationLevel } from './tokens';

export { Colors, darkColors, getColors, lightColors } from './colors';
export { getGlassTokens, type GlassTokens } from './glass';
export { fontBold, fontRegular, fontSemibold, fontWordmark } from './fonts';
export { radii, getElevationStyle, type ElevationLevel } from './tokens';
export {
  colorWithAlpha,
  getAtmosphereGradient,
  getPrimaryTileGradient,
  getSecondaryTileGradient,
  getStatSelectedGradient,
} from './gradients';
export {
  BREAKPOINTS,
  CONTENT_MAX_WIDTH,
  getContentMaxWidth,
  getWidthTier,
  isTabletWidth,
  isWideWidth,
  type WidthTier,
} from '@/lib/breakpoints';

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
    fontFamily: string;
    color: string;
  };
  subtitle: {
    fontSize: number;
    fontWeight: '400';
    fontFamily: string;
    color: string;
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: '400';
    fontFamily: string;
    color: string;
    lineHeight: number;
  };
  label: {
    fontSize: number;
    fontWeight: '600';
    fontFamily: string;
    color: string;
    letterSpacing: number;
  };
};

export function createTypography(colors: Colors): Typography {
  return {
    title: {
      fontSize: 28,
      fontWeight: '700',
      fontFamily: fontBold,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
      fontFamily: fontRegular,
      color: colors.labelSecondary,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      fontFamily: fontRegular,
      color: colors.labelPrimary,
      lineHeight: 24,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
  };
}

export type Theme = {
  colors: Colors;
  spacing: typeof spacing;
  typography: Typography;
  radii: typeof radii;
  isDark: boolean;
  elevation: (level: ElevationLevel) => ReturnType<typeof getElevationStyle>;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();

  return useMemo(() => {
    const colors = getColors(scheme);
    const isDark = scheme === 'dark';

    return {
      colors,
      spacing,
      typography: createTypography(colors),
      radii,
      isDark,
      elevation: (level: ElevationLevel) => getElevationStyle({ isDark, level }),
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

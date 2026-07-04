import { Platform, type ViewStyle } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';

/** Premium-native visual direction: calm surfaces, soft depth, rounded geometry. */
export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 22,
  xxl: 24,
  hero: 28,
  pill: 999,
} as const;

export type ElevationLevel = 'none' | 'subtle' | 'raised' | 'floating';

type ElevationOptions = {
  isDark: boolean;
  level: ElevationLevel;
};

const BRAND_SHADOW_LIGHT = '26, 111, 212';
const BRAND_SHADOW_DARK = '74, 154, 255';

/** Shared elevation tokens for cards, tiles, and stat cells. */
export function getElevationStyle({ isDark, level }: ElevationOptions): ViewStyle {
  if (level === 'none') return {};

  const brandRgb = isDark ? BRAND_SHADOW_DARK : BRAND_SHADOW_LIGHT;

  const nativeShadow =
    level === 'subtle'
      ? {
          shadowColor: isDark ? '#000' : `rgb(${brandRgb})`,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.24 : 0.07,
          shadowRadius: isDark ? 10 : 16,
          elevation: 2,
        }
      : level === 'raised'
        ? {
            shadowColor: isDark ? '#000' : `rgb(${brandRgb})`,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.32 : 0.1,
            shadowRadius: isDark ? 18 : 24,
            elevation: 4,
          }
        : {
            shadowColor: isDark ? '#000' : `rgb(${brandRgb})`,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.38 : 0.14,
            shadowRadius: isDark ? 28 : 32,
            elevation: 8,
          };

  const webShadow =
    level === 'subtle'
      ? isDark
        ? '0 4px 16px rgba(0, 0, 0, 0.28)'
        : `0 8px 28px rgba(${brandRgb}, 0.07)`
      : level === 'raised'
        ? isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.34)'
          : `0 12px 32px rgba(${brandRgb}, 0.1)`
        : isDark
          ? '0 12px 40px rgba(0, 0, 0, 0.4)'
          : `0 16px 40px rgba(${brandRgb}, 0.14)`;

  return Platform.select({
    web: webOnlyStyle({ boxShadow: webShadow } as ViewStyle),
    default: nativeShadow,
  }) as ViewStyle;
}

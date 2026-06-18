import { Platform, type ViewStyle } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';

/** Premium-native visual direction: calm surfaces, soft depth, rounded geometry. */
export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  hero: 28,
  pill: 999,
} as const;

export type ElevationLevel = 'none' | 'subtle' | 'raised' | 'floating';

type ElevationOptions = {
  isDark: boolean;
  level: ElevationLevel;
};

/** Shared elevation tokens for cards, tiles, and stat cells. */
export function getElevationStyle({ isDark, level }: ElevationOptions): ViewStyle {
  if (level === 'none') return {};

  const nativeShadow =
    level === 'subtle'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.22 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        }
      : level === 'raised'
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.28 : 0.08,
            shadowRadius: 14,
            elevation: 4,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.34 : 0.12,
            shadowRadius: 24,
            elevation: 8,
          };

  const webShadow =
    level === 'subtle'
      ? isDark
        ? '0 2px 10px rgba(0, 0, 0, 0.24)'
        : '0 2px 10px rgba(0, 0, 0, 0.05)'
      : level === 'raised'
        ? isDark
          ? '0 6px 20px rgba(0, 0, 0, 0.32)'
          : '0 6px 20px rgba(0, 0, 0, 0.08)'
        : isDark
          ? '0 10px 32px rgba(0, 0, 0, 0.38)'
          : '0 10px 32px rgba(0, 0, 0, 0.12)';

  return Platform.select({
    web: webOnlyStyle({ boxShadow: webShadow } as ViewStyle),
    default: nativeShadow,
  }) as ViewStyle;
}

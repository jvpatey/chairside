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

/** Shared elevation tokens — ambient neutral shadows for dashboard surfaces. */
export function getElevationStyle({ isDark, level }: ElevationOptions): ViewStyle {
  if (level === 'none') return {};

  const nativeShadow =
    level === 'subtle'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.22 : 0.05,
          shadowRadius: isDark ? 12 : 24,
          elevation: 2,
        }
      : level === 'raised'
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.28 : 0.06,
            shadowRadius: isDark ? 16 : 28,
            elevation: 4,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.34 : 0.08,
            shadowRadius: isDark ? 24 : 32,
            elevation: 8,
          };

  const webShadow =
    level === 'subtle'
      ? isDark
        ? '0 4px 16px rgba(0, 0, 0, 0.28)'
        : '0 4px 24px rgba(0, 0, 0, 0.05)'
      : level === 'raised'
        ? isDark
          ? '0 6px 20px rgba(0, 0, 0, 0.32)'
          : '0 6px 28px rgba(0, 0, 0, 0.06)'
        : isDark
          ? '0 10px 32px rgba(0, 0, 0, 0.38)'
          : '0 10px 36px rgba(0, 0, 0, 0.08)';

  return Platform.select({
    web: webOnlyStyle({ boxShadow: webShadow } as ViewStyle),
    default: nativeShadow,
  }) as ViewStyle;
}

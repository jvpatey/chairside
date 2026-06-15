import type { Colors } from './colors';

export type GradientAccent = 'primary' | 'secondary';

function resolveAccentColor(colors: Colors, accent: GradientAccent): string {
  return accent === 'secondary' ? colors.secondary : colors.primary;
}

function resolveAccentSubtle(colors: Colors, accent: GradientAccent): string {
  return accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Top-of-screen brand wash used on dashboard and welcome screens. */
export function getAtmosphereGradient(
  colors: Colors,
  isDark: boolean,
  intensity: 'subtle' | 'prominent' = 'prominent',
  accent: GradientAccent = 'primary',
): readonly [string, string, string, string] {
  const brand = resolveAccentColor(colors, accent);

  if (intensity === 'subtle') {
    const strong = colorWithAlpha(brand, isDark ? 0.16 : 0.11);
    const mid = colorWithAlpha(brand, isDark ? 0.07 : 0.05);
    const soft = colorWithAlpha(brand, isDark ? 0.03 : 0.02);
    return [strong, mid, soft, 'transparent'];
  }

  const strong = colorWithAlpha(brand, isDark ? 0.22 : 0.14);
  const mid = colorWithAlpha(brand, isDark ? 0.1 : 0.06);
  const soft = colorWithAlpha(brand, isDark ? 0.04 : 0.025);
  return [strong, mid, soft, 'transparent'];
}

/** Primary quick-action tile gradient. */
export function getPrimaryTileGradient(colors: Colors, isDark: boolean): readonly [string, string] {
  return isDark
    ? [colorWithAlpha(colors.primary, 0.42), colorWithAlpha(colors.primary, 0.18)]
    : [colorWithAlpha(colors.primary, 0.18), colorWithAlpha(colors.primary, 0.06)];
}

/** Secondary quick-action tile gradient. */
export function getSecondaryTileGradient(colors: Colors, isDark: boolean): readonly [string, string] {
  return isDark
    ? [colorWithAlpha(colors.secondary, 0.28), colorWithAlpha(colors.surfaceElevated, 0.95)]
    : [colorWithAlpha(colors.secondary, 0.1), colorWithAlpha(colors.surface, 0.98)];
}

/** Selected stat cell accent gradient. */
export function getStatSelectedGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): readonly [string, string] {
  const brand = resolveAccentColor(colors, accent);
  const subtle = resolveAccentSubtle(colors, accent);

  return isDark
    ? [colorWithAlpha(brand, 0.34), colorWithAlpha(brand, 0.12)]
    : [colorWithAlpha(brand, 0.16), colorWithAlpha(subtle, 0.9)];
}

/** Soft left-edge wash for already-applied browse list rows. */
export function getAppliedRowGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string, string] {
  return isDark
    ? [
        colorWithAlpha(colors.primary, 0.22),
        colorWithAlpha(colors.primary, 0.07),
        'transparent',
      ]
    : [
        colorWithAlpha(colors.primary, 0.14),
        colorWithAlpha(colors.primary, 0.05),
        'transparent',
      ];
}

/** Fill-in availability hero wash (matches dashboard fill-in accent). */
export function getFillInHeroGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string, string] {
  return isDark
    ? [
        colorWithAlpha(colors.secondary, 0.26),
        colorWithAlpha(colors.secondary, 0.08),
        'transparent',
      ]
    : [
        colorWithAlpha(colors.secondary, 0.16),
        colorWithAlpha(colors.secondary, 0.06),
        'transparent',
      ];
}

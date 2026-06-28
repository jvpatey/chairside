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
    const strong = colorWithAlpha(brand, isDark ? 0.16 : 0.22);
    const mid = colorWithAlpha(brand, isDark ? 0.07 : 0.12);
    const soft = colorWithAlpha(brand, isDark ? 0.03 : 0.05);
    return [strong, mid, soft, 'transparent'];
  }

  const strong = colorWithAlpha(brand, isDark ? 0.22 : 0.3);
  const mid = colorWithAlpha(brand, isDark ? 0.1 : 0.15);
  const soft = colorWithAlpha(brand, isDark ? 0.04 : 0.06);
  return [strong, mid, soft, 'transparent'];
}

/** Primary quick-action tile gradient. */
export function getPrimaryTileGradient(colors: Colors, isDark: boolean): readonly [string, string] {
  return isDark
    ? [colorWithAlpha(colors.primary, 0.42), colorWithAlpha(colors.primary, 0.18)]
    : [colorWithAlpha(colors.primary, 0.3), colorWithAlpha(colors.primarySubtle, 0.95)];
}

/** Secondary quick-action tile gradient. */
export function getSecondaryTileGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string] {
  return isDark
    ? [colorWithAlpha(colors.secondary, 0.28), colorWithAlpha(colors.surfaceElevated, 0.95)]
    : [colorWithAlpha(colors.secondary, 0.22), colorWithAlpha(colors.secondarySubtle, 0.98)];
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
    : [colorWithAlpha(brand, 0.26), colorWithAlpha(subtle, 1)];
}

export type StatSegmentGradient = {
  colors: readonly [string, ...string[]];
  locations?: readonly [number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/** Selected stat pill with neighbor accent bleed on left/right edges. */
export function getStatSelectedSegmentGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent,
  neighbors: { left?: GradientAccent; right?: GradientAccent },
): StatSegmentGradient {
  const brand = resolveAccentColor(colors, accent);
  const subtle = resolveAccentSubtle(colors, accent);
  const leftNeighbor = neighbors.left ? resolveAccentColor(colors, neighbors.left) : null;
  const rightNeighbor = neighbors.right ? resolveAccentColor(colors, neighbors.right) : null;

  if (!isDark) {
    const [top, bottom] = getStatSelectedGradient(colors, isDark, accent);
    return {
      colors: [top, bottom],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    };
  }

  const center = isDark ? colorWithAlpha(brand, 0.34) : colorWithAlpha(brand, 0.26);
  const centerSoft = isDark ? colorWithAlpha(brand, 0.16) : subtle;
  const edgeBleed = (neighbor: string) => colorWithAlpha(neighbor, isDark ? 0.24 : 0.2);

  if (!leftNeighbor && rightNeighbor) {
    return {
      colors: [center, centerSoft, edgeBleed(rightNeighbor)],
      locations: [0, 0.58, 1],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    };
  }

  if (leftNeighbor && !rightNeighbor) {
    return {
      colors: [edgeBleed(leftNeighbor), centerSoft, center],
      locations: [0, 0.42, 1],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    };
  }

  if (leftNeighbor && rightNeighbor) {
    return {
      colors: [edgeBleed(leftNeighbor), center, centerSoft, edgeBleed(rightNeighbor)],
      locations: [0, 0.3, 0.7, 1],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    };
  }

  const [top, bottom] = getStatSelectedGradient(colors, isDark, accent);
  return {
    colors: [top, bottom],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  };
}

/** Soft left-edge wash for already-applied browse list rows. */
export function getAppliedRowGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string, string] {
  return isDark
    ? [colorWithAlpha(colors.primary, 0.22), colorWithAlpha(colors.primary, 0.07), 'transparent']
    : [colorWithAlpha(colors.primary, 0.2), colorWithAlpha(colors.primary, 0.09), 'transparent'];
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
        colorWithAlpha(colors.secondary, 0.24),
        colorWithAlpha(colors.secondary, 0.1),
        'transparent',
      ];
}

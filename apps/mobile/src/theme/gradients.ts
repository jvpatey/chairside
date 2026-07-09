import type { Colors } from './colors';

export type GradientAccent = 'primary' | 'secondary';

/** Hue-shift partners for richer brand gradients. */
const GRADIENT_HUE_SHIFT = {
  primaryEnd: '#4E54E8',
  secondaryEnd: '#8B5CF6',
} as const;

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

/** Rich hero-band wash for the dashboard greeting area. */
export function getHeroBandGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): readonly [string, string, string, string, string, string] {
  const brand = resolveAccentColor(colors, accent);
  const secondary = colors.secondary;
  const indigo = GRADIENT_HUE_SHIFT.primaryEnd;
  const violet = GRADIENT_HUE_SHIFT.secondaryEnd;

  if (isDark) {
    return [
      colorWithAlpha(brand, 0.36),
      colorWithAlpha(indigo, 0.2),
      colorWithAlpha(secondary, 0.16),
      colorWithAlpha(violet, 0.08),
      colorWithAlpha(brand, 0.04),
      'transparent',
    ];
  }

  return [
    colorWithAlpha(brand, 0.42),
    colorWithAlpha(indigo, 0.22),
    colorWithAlpha(secondary, 0.18),
    colorWithAlpha(violet, 0.1),
    colorWithAlpha(brand, 0.05),
    'transparent',
  ];
}

/** Spotlight card gradient — soft surface wash, not a bold banner. */
export function getSpotlightGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): readonly [string, string, string] {
  const brand = resolveAccentColor(colors, accent);
  const subtle = resolveAccentSubtle(colors, accent);

  return isDark
    ? [
        colorWithAlpha(brand, 0.12),
        colorWithAlpha(brand, 0.05),
        colorWithAlpha(colors.surfaceElevated, 0.98),
      ]
    : [
        colorWithAlpha(brand, 0.08),
        colorWithAlpha(subtle, 0.45),
        colors.surface,
      ];
}

/** Selected stat card fill gradient. */
export function getStatCardSelectedGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): readonly [string, string] {
  return getStatSelectedGradient(colors, isDark, accent);
}

/** Unselected stat card subtle surface tint. */
export function getStatCardIdleGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string] {
  return isDark
    ? [colorWithAlpha(colors.surfaceElevated, 0.88), colorWithAlpha(colors.surface, 0.72)]
    : [colors.surface, colorWithAlpha(colors.backgroundGrouped, 0.85)];
}

/** Primary quick-action tile gradient. */
export function getPrimaryTileGradient(colors: Colors, isDark: boolean): readonly [string, string] {
  const end = GRADIENT_HUE_SHIFT.primaryEnd;
  return isDark
    ? [colorWithAlpha(colors.primary, 0.58), colorWithAlpha(end, 0.32)]
    : [colors.primary, colorWithAlpha(end, 0.88)];
}

/** Secondary quick-action tile gradient. */
export function getSecondaryTileGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string] {
  const end = GRADIENT_HUE_SHIFT.secondaryEnd;
  return isDark
    ? [colorWithAlpha(colors.secondary, 0.42), colorWithAlpha(end, 0.28)]
    : [colors.secondary, colorWithAlpha(end, 0.86)];
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

/** Location stops for fill-in hero washes — long tail avoids a harsh bottom edge. */
export const FILL_IN_HERO_GRADIENT_LOCATIONS = [0, 0.28, 0.55, 0.78, 1] as const;

export const FEATURED_LISTING_GRADIENT_LOCATIONS = [0, 0.32, 0.58, 0.82, 1] as const;

export type FeaturedListingGradient = {
  colors: readonly string[];
  locations: readonly number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/** Left-to-right spotlight wash for priority / featured listing cards. */
export function getFeaturedListingGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): FeaturedListingGradient {
  const brandColor = resolveAccentColor(colors, accent);

  const gradientColors =
    accent === 'secondary'
      ? isDark
        ? ([
            colorWithAlpha(brandColor, 0.48),
            colorWithAlpha(brandColor, 0.28),
            colorWithAlpha(brandColor, 0.14),
            colorWithAlpha(brandColor, 0.05),
            'transparent',
          ] as const)
        : ([
            colorWithAlpha(brandColor, 0.36),
            colorWithAlpha(brandColor, 0.2),
            colorWithAlpha(brandColor, 0.09),
            colorWithAlpha(brandColor, 0.03),
            'transparent',
          ] as const)
      : isDark
        ? ([
            colorWithAlpha(brandColor, 0.42),
            colorWithAlpha(brandColor, 0.24),
            colorWithAlpha(brandColor, 0.12),
            colorWithAlpha(brandColor, 0.04),
            'transparent',
          ] as const)
        : ([
            colorWithAlpha(brandColor, 0.3),
            colorWithAlpha(brandColor, 0.16),
            colorWithAlpha(brandColor, 0.07),
            colorWithAlpha(brandColor, 0.02),
            'transparent',
          ] as const);

  return {
    colors: gradientColors,
    locations: FEATURED_LISTING_GRADIENT_LOCATIONS,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  };
}

/** Fill-in availability hero wash (matches dashboard fill-in accent). */
export function getFillInHeroGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string, string, string, string] {
  const end = GRADIENT_HUE_SHIFT.secondaryEnd;
  return isDark
    ? [
        colorWithAlpha(colors.secondary, 0.24),
        colorWithAlpha(end, 0.11),
        colorWithAlpha(end, 0.045),
        colorWithAlpha(colors.secondary, 0.012),
        'transparent',
      ]
    : [
        colorWithAlpha(colors.secondary, 0.2),
        colorWithAlpha(end, 0.09),
        colorWithAlpha(end, 0.035),
        colorWithAlpha(colors.secondary, 0.01),
        'transparent',
      ];
}

/** Active tab dock indicator gradient. */
export function getTabIndicatorGradient(
  colors: Colors,
  isDark: boolean,
  accent: GradientAccent = 'primary',
): readonly [string, string] {
  if (accent === 'secondary') {
    return isDark
      ? [colors.secondary, GRADIENT_HUE_SHIFT.secondaryEnd]
      : [colors.secondary, GRADIENT_HUE_SHIFT.secondaryEnd];
  }

  return isDark
    ? [colors.primary, GRADIENT_HUE_SHIFT.primaryEnd]
    : [colors.primary, GRADIENT_HUE_SHIFT.primaryEnd];
}

/** Horizontal fade used between dashboard quick actions and stat cards. */
export function getDashboardSectionDividerGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string, string, string, string] {
  return [
    'transparent',
    colorWithAlpha(colors.primary, isDark ? 0.14 : 0.1),
    colorWithAlpha(colors.secondary, isDark ? 0.2 : 0.14),
    colorWithAlpha(colors.primary, isDark ? 0.14 : 0.1),
    'transparent',
  ];
}

/** Subtle gradient for dark-mode card surfaces. */
export function getSurfaceGradient(
  colors: Colors,
  isDark: boolean,
): readonly [string, string] {
  return isDark
    ? [colors.surfaceElevated, colors.surface]
    : [colors.surface, colors.surface];
}

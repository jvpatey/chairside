export const BREAKPOINTS = {
  /** Phone and narrow Split View widths */
  compact: 600,
  /** iPad regular width — sidebar navigation threshold */
  regular: 768,
  /** iPad landscape / wide Stage Manager windows */
  wide: 1024,
  /** Large desktop monitors */
  xwide: 1440,
} as const;

export const CONTENT_MAX_WIDTH = {
  phone: undefined as number | undefined,
  regular: 960,
  wide: 1200,
  xwide: 1320,
} as const;

/** Extra top inset below the safe area for aligned sidebar + dashboard content. */
export const TABLET_TOP_INSET_EXTRA = 8;

/** Web sidebar glass panel inset from viewport — matches `TabletSidebar` outerWeb padding. */
export const WEB_SIDEBAR_OUTER_INSET = 8;

/** Matches sidebar profile avatar row height for cross-pane alignment. */
export const TABLET_PROFILE_ROW_HEIGHT = 56;

export type WidthTier = 'compact' | 'regular' | 'wide' | 'xwide';

export function getWidthTier(width: number): WidthTier {
  if (width >= BREAKPOINTS.xwide) return 'xwide';
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.regular) return 'regular';
  return 'compact';
}

export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS.regular;
}

export function isWideWidth(width: number): boolean {
  return width >= BREAKPOINTS.wide;
}

export function isXWideWidth(width: number): boolean {
  return width >= BREAKPOINTS.xwide;
}

export function getContentMaxWidth(width: number): number | undefined {
  const tier = getWidthTier(width);
  if (tier === 'xwide') return CONTENT_MAX_WIDTH.xwide;
  if (tier === 'wide') return CONTENT_MAX_WIDTH.wide;
  if (tier === 'regular') return CONTENT_MAX_WIDTH.regular;
  return CONTENT_MAX_WIDTH.phone;
}

import { radii } from '@/theme';

/** Shared geometry for card surfaces and grouped list shells. */
export const cardShellRadii = {
  surface: radii.lg,
  group: radii.lg,
  inner: radii.md,
  titleBand: radii.md,
} as const;

/** Minimum heights by card family — keeps sections visually cohesive. */
export const cardMinHeights = {
  listingTile: 116,
  applicationTile: 132,
  dashboardTile: 108,
} as const;

export type CardPaddingTier = 'md' | 'lg';

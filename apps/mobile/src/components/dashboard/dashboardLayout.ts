import type { Theme } from '@/theme';

/** Shared corner radii for dashboard controls — aligned tiers, softer than full pill. */
export const dashboardControlRadii = {
  quickAction: 22,
  statBar: 20,
  statSegment: 16,
} as const;

/** Shared spacing rhythm for dashboard screens on phone and tablet. */
export function getDashboardLayoutStyles({ spacing }: Pick<Theme, 'spacing'>) {
  return {
    content: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    overviewSection: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  };
}

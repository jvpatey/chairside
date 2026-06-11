import type { Theme } from '@/theme';

/** Shared spacing rhythm for dashboard screens on phone and tablet. */
export function getDashboardLayoutStyles({ spacing }: Pick<Theme, 'spacing'>) {
  return {
    content: {
      gap: spacing.xl,
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
    },
  };
}

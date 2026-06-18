import { Platform } from 'react-native';

import type { Theme } from '@/theme';

/** Shared vertical gap for the mobile dashboard header stack and header-to-content spacing. */
export function dashboardHeaderStackGap(spacing: Pick<Theme, 'spacing'>['spacing']) {
  return spacing.sm;
}

/** Shared corner radii for dashboard controls — aligned tiers, softer than full pill. */
export const dashboardControlRadii = {
  quickAction: 22,
  statBar: 20,
  statSegment: 16,
} as const;

/** Vertical gap between major dashboard sections (hero, actions, overview, etc.). */
export function dashboardSectionGap(spacing: Pick<Theme, 'spacing'>['spacing']) {
  return spacing.lg;
}

/** Shared spacing rhythm for dashboard screens on phone and tablet. */
export function getDashboardLayoutStyles({ spacing }: Pick<Theme, 'spacing'>) {
  const sectionGap = dashboardSectionGap(spacing);
  const headerStackGap = dashboardHeaderStackGap(spacing);

  return {
    /** Wraps brand header + dashboard body so spacing matches the header text rhythm. */
    flow: {
      gap: headerStackGap,
    },
    content: {
      gap: sectionGap,
      ...(Platform.OS === 'web' ? { paddingTop: spacing.sm } : null),
    },
    section: {
      gap: spacing.sm,
    },
    quickActionSection: {
      gap: spacing.sm,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    /** Stat bar + overview list share one vertical rhythm block. */
    overviewBlock: {
      gap: sectionGap,
    },
  };
}
